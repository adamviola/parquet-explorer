export interface DescribeColumn {
    column_name: string;
    column_type: string;
}

interface QueryMessage {
    type: "query";
    success: boolean;
    results?: unknown[];
    describe?: DescribeColumn[];
    message?: string;
}

interface MoreMessage {
    type: "more";
    success: boolean;
    results?: unknown[];
    message?: string;
}

interface ConfigMessage {
    type: "config";
    autoQuery?: boolean;
}

interface ReloadBaseViewMessage {
    type: "reloadBaseView";
}

/** Backend (extension) to Frontend (webview) message. */
export type BackToFrontMessage = QueryMessage | MoreMessage | ConfigMessage | ReloadBaseViewMessage;



/** Frontend (webview) to Backend (extension) message. */
export type FrontToBackMessage = {
    type: 'query';
    sql: string;
    limit: number;
} | {
    type: 'more';
    sql: string;
    limit: number;
    offset: number;
} | { type: 'config'; autoQuery: boolean; } | { type: 'reloadBaseView' } | {
    type: 'copy';
    sql: string;
};
