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


(function () {
    // Get a reference to the VS Code webview api.
    // We use this API to post messages back to our extension.
    const vscode = acquireVsCodeApi();

    let textAreaElement = undefined;
    let resultsHeaderElement = undefined;
    let resultsBodyElement = undefined;
    let loadingIconElement = undefined;

    const batchSize = 100;
    let loadingScroll = false;
    let scrollOffset = 0;

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'query':
                loadingIconElement.style.display = "none";
                textAreaElement.disabled = false

                while (resultsHeaderElement.firstChild) {
                    resultsHeaderElement.removeChild(resultsHeaderElement.lastChild);
                }

                if (message.results) {
                    const headerRow = document.createElement("tr");
                    Object.keys(message.results[0]).forEach((column) => {
                        const columnHeader = document.createElement("th");
                        const backgroundBackground = document.createElement("div");
                        const background = document.createElement("div");
                        const text = document.createElement("div");

                        backgroundBackground.className = "headerBackgroundBackground";
                        background.className = "headerBackground";
                        text.className = "headerText";
                        text.innerText = column;

                        columnHeader.append(backgroundBackground, background, text);
                        headerRow.append(columnHeader);
                    });
                    resultsHeaderElement.append(headerRow);

                    while (resultsBodyElement.firstChild) {
                        resultsBodyElement.removeChild(resultsBodyElement.lastChild);
                    }
                    message.results.forEach((result) => {
                        const resultRow = document.createElement("tr");
                        Object.values(result).forEach((value) => {
                            const resultData = document.createElement("td");
                            const background = document.createElement("div");
                            const text = document.createElement("div");

                            background.className = "resultBackground"
                            text.className = "resultText"
                            text.innerText = value;

                            resultData.append(background, text);
                            resultRow.append(resultData);
                        })
                        resultsBodyElement.append(resultRow);
                    })


                }
                else if (message.message) {
                    const headerRow = document.createElement("tr");
                    const columnHeader = document.createElement("th");
                    const backgroundBackground = document.createElement("div");
                    const background = document.createElement("div");
                    const text = document.createElement("div");

                    backgroundBackground.className = "headerBackgroundBackground";
                    background.className = "headerBackground";
                    text.className = "headerText";
                    text.innerText = message.message;

                    columnHeader.append(backgroundBackground, background, text);
                    headerRow.append(columnHeader);
                    resultsHeaderElement.append(headerRow);

                }
                return;

            case 'more':
                loadingIconElement.style.display = "none";
                textAreaElement.disabled = false

                if (message.results.length > 0) {
                    message.results.forEach((result) => {
                        const resultRow = document.createElement("tr");
                        Object.values(result).forEach((value) => {
                            const resultData = document.createElement("td");
                            const background = document.createElement("div");
                            const text = document.createElement("div");

                            background.className = "resultBackground"
                            text.className = "resultText"
                            text.innerText = value;

                            resultData.append(background, text);
                            resultRow.append(resultData);
                        })
                        resultsBodyElement.append(resultRow);
                    });
                    loadingScroll = false;
                }
        }
    });

    window.addEventListener("scroll", (event) => {
        let scroll = this.scrollY;

        const elem = document.getElementById("results");
        if (this.innerHeight + this.scrollY >= elem.offsetTop + elem.offsetHeight && !loadingScroll) {
            loadingScroll = true;
            scrollOffset += batchSize;
            loadingIconElement.style.display = "block"
            textAreaElement.disabled = true
            const sql = textAreaElement.parentElement.value;
            vscode.postMessage({
                type: 'more',
                sql: sql,
                limit: batchSize,
                offset: scrollOffset
            })
        }

        document.getElementById("controls").style.top = `-${scroll}px`;
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
            document.getElementById("results").style.marginTop = `${height}px`;
        }

        vscode.setState({ sql: event.target.parentElement.value })
    }

    const onChange = (event) => {
        const sql = event.target.parentElement.value;

        loadingScroll = false;

        loadingIconElement.style.display = "block"
        textAreaElement.disabled = true
        while (resultsHeaderElement.firstChild) {
            resultsHeaderElement.removeChild(resultsHeaderElement.lastChild);
        }
        while (resultsBodyElement.firstChild) {
            resultsBodyElement.removeChild(resultsBodyElement.lastChild);
        }

        vscode.postMessage({
            type: 'query',
            sql: sql,
            limit: batchSize
        })

    }

    waitForElements(["textarea", "#resultsHeader", "#resultsBody", "#loadingIcon"]).then(([textarea, resultsHeader, resultsBody, loadingIcon]) => {
        textAreaElement = textarea;
        resultsHeaderElement = resultsHeader;
        resultsBodyElement = resultsBody;
        loadingIconElement = loadingIcon;

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
