// Provides callback for when HTML element loads
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });

    });
}

function waitForElements(selectors) {
    return new Promise(resolve => {
        let numWaiting = selectors.length
        const elements = selectors.map(() => null);
        const callback = (element, index) => {
            numWaiting--;
            elements[index] = element
            if (numWaiting == 0) {
                resolve(elements);
            }
        };
        selectors.forEach((selector, index) => {
            waitForElement(selector).then((element) => callback(element, index));
        });
    });

}

// https://tabulator.info/docs/6.2/format
function getFormatter(columnType) {
    switch (columnType) {
        case "DATE":
            return {
                formatter: "datetime",
                formatterParams: {
                    inputFormat: "iso",
                    outputFormat: "yyyy-MM-dd",
                    timezone: "utc", // this could be configurable
                },
            };
        default:
            return {};
    }
}


(function () {
    // Get a reference to the VS Code webview api.
    // We use this API to post messages back to our extension.
    const vscode = acquireVsCodeApi();

    let textAreaElement = undefined;
    let loadingIconElement = undefined;
    let errorMessageElement = undefined;
    let tableElement = undefined;
    let table = undefined;
    let last_sql = undefined;

    // Whether the spinner is currently showoing
    let loadingScroll = false;

    // Whether or not there's additional query results to load
    let moreToLoad = false;

    // Offset to use when fetching additional results
    let scrollOffset = 0;

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'query':
                loadingScroll = false;
                loadingIconElement.style.display = "none";
                textAreaElement.disabled = false;

                if (message.results) {
                    tableElement.style.display = "block"
                    moreToLoad = message.results.length >= CHUNK_SIZE
                    scrollOffset = 0

                    const columns = [
                        { formatter: "rownum", hozAlign: "right", headerHozAlign: "center", width: 1, frozen: true, resizable: false, },
                        ...message.describe.map(column => {
                            return {
                                title: column.column_name,
                                field: column.column_name,
                                headerTooltip: column.column_type,
                                ...getFormatter(column.column_type),
                            }
                        })
                    ];

                    if (table) {
                        table.replaceData(message.results);
                        table.setColumns(columns);
                    }
                    else {
                        table = new Tabulator("#results", {
                            height: "calc(100% + 10vh)",
                            data: message.results,
                            layout: "fitData",
                            placeholder: "No Results",
                            resizableColumnGuide: true,
                            columnDefaults: {
                                resizable: true,
                                headerSort: false,
                                formatter: "textarea",
                                maxInitialWidth: window.innerWidth * 0.4,
                            },
                            columns: columns
                        });
                        table.on("scrollVertical", function (top) {
                            const element = table.rowManager.element;
                            if (top >= element.scrollHeight - element.offsetHeight && !loadingScroll && moreToLoad) {
                                loadingScroll = true;
                                scrollOffset += CHUNK_SIZE;
                                loadingIconElement.style.display = "block"
                                textAreaElement.disabled = true
                                const sql = textAreaElement.parentElement.value;
                                vscode.postMessage({
                                    type: 'more',
                                    sql: sql,
                                    limit: CHUNK_SIZE,
                                    offset: scrollOffset
                                })
                            }
                        });
                    }

                }
                else if (message.message) {
                    tableElement.style.display = "none"
                    errorMessageElement.style.display = "block";
                    errorMessageElement.textContent = message.message;
                }
                break;

            case 'more':
                loadingScroll = false;
                loadingIconElement.style.display = "none";
                textAreaElement.disabled = false

                if (message.results.length < CHUNK_SIZE)
                    moreToLoad = false

                if (message.results.length > 0 && table) {
                    table.addData(message.results)
                }
                break;
        }
    });

    // Initialize the text area syntax highlighting
    codeInput.registerTemplate("syntax-highlighted",
        codeInput.templates.prism(
            Prism,
            [
                new codeInput.plugins.Indent()
            ]
        )
    );

    // Define text-area event handlers
    const onKeyDown = (event) => {
        // Allow Ctrl/Cmd + Enter to send query
        if ((event.ctrlKey || event.metaKey) && event.code == "Enter") {
            event.preventDefault();
            event.stopPropagation();
            textAreaElement.dispatchEvent(new Event("change"));
        }
    }

    let controlsHeight = 0;
    const onInput = (event) => {
        const height = document.getElementById("controls").offsetHeight;
        if (controlsHeight != height) {
            controlsHeight = height;
        }

        vscode.setState({ sql: event.target.parentElement.value })
    }

    const onChange = (event) => {
        const sql = event.target.parentElement.value;

        // Ctrl/Cmd + Enter causes onChange to be called twice
        if (sql === last_sql)
            return;
        last_sql = sql;

        loadingScroll = true;
        tableElement.style.display = "none"
        loadingIconElement.style.display = "block"
        errorMessageElement.style.display = "none";
        textAreaElement.disabled = true

        if (table) {
            table.replaceData([]);
            table.setColumns([]);
        }

        vscode.postMessage({
            type: 'query',
            sql: sql,
            limit: CHUNK_SIZE,
        })

    }

    waitForElements(["textarea", "#results", "#loadingIcon", "#errorMessage"]).then(([textarea, results, loadingIcon, errorMessage]) => {
        textAreaElement = textarea;
        loadingIconElement = loadingIcon;
        errorMessageElement = errorMessage;
        tableElement = results;

        // Register text-area event handlers
        textarea.addEventListener("input", onInput);
        textarea.addEventListener("change", onChange);
        textarea.addEventListener("keydown", onKeyDown, true);

        // Load stored query (if any) and trigger its execution
        const state = vscode.getState();
        if (state)
            textarea.parentElement.value = state.sql;
        textarea.dispatchEvent(new Event("input"));
        textarea.dispatchEvent(new Event("change"));

    })

}());
