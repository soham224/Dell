import { useEffect, useState } from "react";
import { request } from "./APIRequestService";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import { actions, clearPopupDataAction } from "../app/Admin/modules/Locations/_redux/LocationAction";

const FetchDataInEveryFiveMin = () => {
    const dispatch = useDispatch();

    const { user } = useSelector(
        ({ auth }) => ({
            user: auth.user,
        }),
        shallowEqual
    );

    const [labelList, setLabelList] = useState([]);

    const getLabelData = async () => {
        try {
            const response = await request({
                method: "POST",
                endpoint: "/get_all_camera_label_mapping?company_id=1",
            });

            if (response.isSuccess) {
                const data = response?.data || [];
                setLabelList(data);
            }
        } catch (error) {
            console.error("Label API fetch error:", error);
        }
    };

    const fetchData = async () => {
        if (labelList.length === 0) return;

        const data = {
            time_period: 1,
            label_list: labelList,
        };

        try {
            const response = await request({
                method: "POST",
                endpoint: "/get_popup_data",
                body: JSON.stringify(data),
            });

            if (response.isSuccess && response.data && response.data.length > 0) {
                dispatch(actions.popupData(response.data));
            }

        } catch (error) {
            console.error("Popup API fetch error:", error);
            // On error, ensure popup data is cleared
            dispatch(clearPopupDataAction());
        }
    };

    useEffect(() => {
        if (user) {
            getLabelData();
        }
    }, [user]);

    // ✅ Poll popup data every 1 minutes, only when labelList is populated
    useEffect(() => {
        if (user && labelList.length > 0) {
            // Initial fetch
            fetchData();
            
            const interval = setInterval(() => {
                fetchData();
            }, 60000); // 1 minute

            return () => clearInterval(interval);
        }
    }, [user, labelList]);

    return null;
};

export default FetchDataInEveryFiveMin;
