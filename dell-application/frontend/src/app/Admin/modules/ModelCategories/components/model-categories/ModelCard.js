import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, CardImg, CardBody, CardTitle, CardText } from "reactstrap";
import { useDispatch } from "react-redux";
import { setModelName } from "../../../../../../redux/subscriptionReducer";
import { ADMIN_URL } from "../../../../../../enums/constant";
import {toAbsoluteUrl} from "../../../../../../_metronic/_helpers";

export function ModelCard({ model }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const MODEL_CATEGORY_PAGE_BASE_URL = ADMIN_URL + "/model-categories/view";

  React.useEffect(() => {
    dispatch(setModelName(""));
  }, [dispatch]);

  const handleLearnMore = () => {
    navigate(`${MODEL_CATEGORY_PAGE_BASE_URL}/model/${model?.id}`);
  };

  const handleClick = React.useCallback(() => {
    handleLearnMore();
  }, []);

  return (
      <Card className="h-100 d-flex flex-column">
        <CardImg
            top
            alt={`${model?.model_name} Image`}
            src={toAbsoluteUrl(`${model?.model_result_img[0]?.image_url}`)}
          style={{ height: 210, objectFit: "cover" }}
        />
        <CardBody className="d-flex flex-column ">
          <CardTitle tag="h5">{model?.model_name}</CardTitle>
          <CardText className="" style={{ overflow: "hidden" }}>
            {model?.model_description}
          </CardText>
          <Button color="primary" onClick={handleClick} className="align-self-start">
            Learn More
          </Button>
        </CardBody>
      </Card>
  );
}
