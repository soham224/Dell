import { request } from "../../../../../utils/APIRequestService";
import { HttpRequest } from "../../../../../enums/http.methods";
import {SUPER_ADMIN_ROLE} from "../../../../../enums/constant";

const GET_ACTIVITY_LOGS = "/get_activity_logs";
const GET_SUPERUSER_ACTIVITY_LOGS="/get_superuser_activity_logs"

export async function getActivityLogs({
                                          startDate,
                                          endDate,
                                          activityTypeIdList,
                                          pageSize,
                                          pageNo,
                                          searchKey,
                                          userRole
                                      }) {
    const baseParams = {
        start_date: startDate,
        end_date: endDate,
        page_number: pageNo,
        page_size: pageSize,
        search_key: searchKey
    };

    const queryString = Object.entries(baseParams)
        .map(([key, val]) => `${key}=${encodeURIComponent(val || '')}`)
        .join('&');

    const endpoint = userRole === SUPER_ADMIN_ROLE
        ? `${GET_SUPERUSER_ACTIVITY_LOGS}?company_id=1&${queryString}`
        : `${GET_ACTIVITY_LOGS}?${queryString}`;

    return await request({
        endpoint,
        method: HttpRequest.POST,
        body: activityTypeIdList

    });
}
