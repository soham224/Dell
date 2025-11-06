/* eslint-disable jsx-a11y/aria-proptypes */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useState} from "react";
import clsx from "clsx";
// https://github.com/conorhastings/react-syntax-highlighter#prism
import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
// See https://github.com/PrismJS/prism-themes
import {coy as highlightStyle} from "react-syntax-highlighter/dist/esm/styles/prism";
import {CodeBlockToolbar} from "./CodeBlockToolbar";

export function CodeBlock({
    languages,
    tabs,
    codeShown,
    customStyle,
    showToolbar = true,
    defaultLanguage = "jsx",
    className = ""
}) {
    // Use provided state or create internal state
    const [internalTabId, setInternalTabId] = useState(0);
    const [internalIsCodeBlockShown, setInternalIsCodeBlockShown] = useState(false);

    const tabId = tabs?.tabId ?? internalTabId;
    const setTabId = tabs?.setTabId ?? setInternalTabId;
    const isCodeBlockShown = codeShown?.isCodeBlockShown ?? internalIsCodeBlockShown;
    const setIsCodeBlockShown = codeShown?.setIsCodeBlockShown ?? setInternalIsCodeBlockShown;

    return (
        <>
            {showToolbar && (
                <div className="example-tools">
                    <CodeBlockToolbar
                        showViewCode={true}
                        code={languages[tabId].code}
                        isCodeBlockShown={isCodeBlockShown}
                        setIsCodeBlockShown={setIsCodeBlockShown}
                    />
                </div>
            )}
            {languages.length === 0 && <></>}
            {languages.length === 1 && (
                <div
                    className={`example-code ${className} ${clsx({
                        "example-code-on": isCodeBlockShown
                    })}`}
                    style={{display: isCodeBlockShown ? "block" : "none"}}
                >
                    <div className={`example-highlight ${languages[0].language || defaultLanguage}`}>
                        <SyntaxHighlighter
                            language={languages[0].language || defaultLanguage}
                            style={highlightStyle}
                            customStyle={customStyle}
                        >
                            {languages[0].code}
                        </SyntaxHighlighter>
                    </div>
                </div>
            )}
            {languages.length > 1 && (
                <>
                    <div
                        className={`example-code ${className} ${clsx({
                            "example-code-on": isCodeBlockShown
                        })}`}
                        style={{display: isCodeBlockShown ? "block" : "none"}}
                    >
                        <ul
                            className="example-nav nav nav-tabs nav-tabs-line nav-tabs-line-2x nav-tabs-primary"
                            id="codeTab"
                            role="tablist"
                        >
                            {languages.map((lang) => (
                                <li className="nav-item" key={lang.shortCode}>
                                    <a
                                        className={`nav-link ${tabId === lang.shortCode ? "active" : ""}`}
                                        data-toggle="tab"
                                        role="tab"
                                        aria-selected={`${tabId === lang.shortCode ? "true" : "false"}`}
                                        onClick={() => setTabId(lang.shortCode)}
                                    >
                                        {lang.shortCode}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="tab-content">
                            {languages.map((lang) => (
                                <div
                                    style={{background: "#F3F6F9"}}
                                    className={`tab-pane ${tabId === lang.shortCode ? "active" : ""}`}
                                    key={`divTabPane${lang.shortCode}`}
                                >
                                    <div
                                        className={`example-highlight language-${lang.shortCode} ${lang.shortCode}`}
                                    >
                                        <SyntaxHighlighter
                                            language={lang.language || defaultLanguage}
                                            style={highlightStyle}
                                            customStyle={customStyle}
                                        >
                                            {lang.code}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}
