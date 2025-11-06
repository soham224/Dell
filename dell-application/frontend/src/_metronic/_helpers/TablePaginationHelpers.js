/* Pagination Helprs */
import React from "react";
import {matchSorter} from "match-sorter";
import {entitiesSorter} from "./TableSortingHelpers";
import * as uiHelpers from "../../utils/UIHelpers";

export const getPagesCount = (totalSize, sizePerPage) => {
  return Math.ceil(totalSize / sizePerPage);
};

const getInitialPages = (pagesCount) => {
  const result = [];
  for (let i = 1; i < pagesCount + 1; i++) {
    result.push(i);
  }
  return result;
};

const getPagesForStart = (paginationSize) => {
  const result = [];
  for (let i = 1; i < paginationSize + 1; i++) {
    result.push(i);
  }
  return result;
};

const getPagesForEnd = (pagesCount, paginationSize) => {
  const result = [];
  for (let i = pagesCount - paginationSize + 1; i <= pagesCount; i++) {
    result.push(i);
  }
  return result;
};

const getPagesForMiddle = (page, shiftCount, pagesCount) => {
  const result = [];
  for (let i = page - shiftCount; i < page; i++) {
    if (i > 0) {
      result.push(i);
    }
  }
  result.push(page);
  for (let i = page + 1; i < page + shiftCount + 1; i++) {
    if (i <= pagesCount) {
      result.push(i);
    }
  }
  return result;
};

export const getPages = (page, pagesCount, paginationSize) => {
  if (!page || pagesCount < page) {
    return [];
  }

  if (pagesCount === 1) {
    return [1];
  }

  if (pagesCount < paginationSize + 1) {
    return getInitialPages(pagesCount);
  }

  if (page === 1) {
    return getPagesForStart(paginationSize);
  }

  if (page === pagesCount) {
    return getPagesForEnd(pagesCount, paginationSize);
  }

  const shiftCount = Math.floor(paginationSize / 2);
  if (shiftCount < 1) {
    return [page];
  }

  if (page < shiftCount + 2) {
    return getPagesForStart(paginationSize);
  }

  if (pagesCount - page < shiftCount + 2) {
    return getPagesForEnd(pagesCount, paginationSize);
  }

  return getPagesForMiddle(page, shiftCount, pagesCount);
};

export function getHandlerTableChange(setQueryParams) {
  return (type, {page, sizePerPage, sortField, sortOrder, data}) => {
    const pageNumber = page || 1;
    setQueryParams((prev) => {
      if (type === "sort") {
        return {...prev, sortOrder, sortField};
      } else if (type === "pagination") {
        return {...prev, pageNumber, pageSize: sizePerPage};
      } else {
        return prev;
      }
    });
  };
}

export function PleaseWaitMessage({entities}) {
  return <>{entities === null && <div>Please wait...</div>}</>;
}

export function NoRecordsFoundMessage({entities}) {
  const customersList = entities === null ? [] : entities;
  return (
      <>
        {customersList.length === 0 && entities !== null && (
            <div>No records found</div>
        )}
      </>
  );
}

export function getFilteredAndPaginatedEntities(entities, pageParams) {
  let {pageNumber, pageSize} = pageParams;
  const indexOfLast = pageNumber * pageSize;
  const indexOfFirst = indexOfLast - pageSize;
  return (entities || []).slice(indexOfFirst, indexOfLast);
}
export function getCustomFilteredAndPaginatedEntities(entities, { pageSize, pageNumber }) {
  const start = (pageNumber - 1) * pageSize;
  return (entities || []).slice(start, start + pageSize);
}


export const entityFilter = (entities, searchStr, keys, filterParams, filteredEntitiesSetter) => {
  if (searchStr) {
    filteredEntitiesSetter(matchSorter(entities, searchStr, {keys}).sort(entitiesSorter(filterParams))
    );
  } else {
    if (entities)
      filteredEntitiesSetter(entities.slice().sort(entitiesSorter(filterParams)));
    else
      filteredEntitiesSetter(entities);
  }
  return getFilteredAndPaginatedEntities(entities, filterParams);
}

export const getPaginationOptions = (totalSize, pageParams) => ({
  custom: true,
  totalSize: totalSize || 0,
  sizePerPageList: uiHelpers.sizePerPageList,
  sizePerPage: pageParams.pageSize,
  page: pageParams.pageNumber
});
export const getNewPaginationOptions = (totalSize, pageParams ,pageSize , pageNumber) => (
 {
  custom: true,
  totalSize: totalSize || 0,
  sizePerPageList: pageParams,
  sizePerPage: pageSize,
  page: pageNumber
}
);

