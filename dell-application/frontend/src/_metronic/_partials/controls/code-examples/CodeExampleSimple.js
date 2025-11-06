/* eslint-disable jsx-a11y/aria-proptypes */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, {useEffect, useState} from "react";
import {CodeBlock} from "./CodeBlock";
import {Tooltip} from "@mui/material";
import clsx from "clsx";
import copy from "clipboard-copy";

export function CodeExampleSimple({languages, children, codeBlockHeight}) {
  const [isCopySucceed, setIsCopySucceed] = useState(false);
  const [tabId, setTabId] = useState(0);
  const [isCodeBlockShown, setIsCodeBlockShown] = useState(true);
  const [customStyle, setCustomStyle] = useState({});

  const copyCode = () => {
    if (!languages.length) {
      return;
    }

    copy(languages[tabId].code).then(() => {
      setIsCopySucceed(true);
      setTimeout(() => {
        setIsCopySucceed(false);
      }, 2000);
    });
  };

  useEffect(() => {
    const styles = {};

    if (codeBlockHeight) {
      styles.height = codeBlockHeight;
    }

    if (languages.length > 1) {
      styles.background = `none transparent !important`;
    }

    setCustomStyle(styles);
  }, [codeBlockHeight, languages]);

  return (
    <>
      <>{children}</>
      <div style={{background: "#F3F6F9"}}>
        <Tooltip title="Copy code">
          <span
            className={`example-copy ${clsx({
              "example-copied": isCopySucceed
            })}`}
            onClick={copyCode}
          />
        </Tooltip>
        <CodeBlock
          languages={languages}
          tabs={{tabId, setTabId}}
          codeShown={{isCodeBlockShown, setIsCodeBlockShown}}
          customStyle={customStyle}
          showToolbar={false}
        />
      </div>
    </>
  );
}

export function CodeExampleSimplePreview({children}) {
  return <div className="example-preview">{children}</div>;
}

export function CodeExampleSimpleDescription({children}) {
  return <p className="example-description">{children}</p>;
}

export function CodeExampleSimpleWrapper({title, children}) {
  return (
    <div className="card card-custom gutter-b example">
      <div className="card-header">
        <div className="card-title">
          <h3 className="card-label">{title}</h3>
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}
