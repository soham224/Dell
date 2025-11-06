/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React, {useEffect, useState} from "react";
import {Card, CardBody, CardHeader} from "../Card";
import {CodeBlockToolbar} from "../code-examples/CodeBlockToolbar";
import {CodeBlock} from "../code-examples/CodeBlock";

export function KTCodeExample({
                                jsCode,
                                children,
                                beforeCodeTitle,
                                languages,
                                codeBlockHeight
                              }) {
  const defaultLanguages = !languages
      ? [
        {
          code: jsCode,
          language: "javascript",
          shortCode: "JS"
        }
      ]
      : languages;
  const [isCodeBlockShown, setIsCodeBlockShown] = useState(false);
  const [tabId, setTabId] = useState(0);
  const [customStyle, setCustomStyle] = useState({});
  useEffect(() => {
    const styles = {};

    if (codeBlockHeight) {
      styles.height = codeBlockHeight;
      styles.overflowX = "auto";
    }

    if (defaultLanguages.length > 1) {
      styles.background = `none transparent !important`;
    }

    setCustomStyle(styles);
  }, [codeBlockHeight, defaultLanguages.length]);

  const toolbar = (
      <div className="card-toolbar">
        <div className="example-tools">
          <CodeBlockToolbar
              showViewCode={true}
              code={defaultLanguages[tabId].code}
              isCodeBlockShown={isCodeBlockShown}
              setIsCodeBlockShown={setIsCodeBlockShown}
          />
        </div>
      </div>
  );

  return (
      <Card className="example example-compact">
        <CardHeader title={beforeCodeTitle} toolbar={toolbar}/>
        <CardBody>
          <>{children}</>
          <CodeBlock
              languages={defaultLanguages}
              tabs={{tabId, setTabId}}
              codeShown={{isCodeBlockShown, setIsCodeBlockShown}}
              customStyle={customStyle}
              showToolbar={false}
              className="mt-5"
          />
        </CardBody>
      </Card>
  );
}
