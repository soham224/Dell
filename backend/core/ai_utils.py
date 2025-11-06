# import logging
# import os
# import requests
#
# def update_ai_details(camera_id):
#     url = os.getenv("AI_UPDATE_CAMERA_DETAILS_URL")
#     headers = {
#         "Content-Type": "application/json",
#         "Authorization": f"Api-Key {os.getenv('AI_UPDATE_CAMERA_DETAILS_API_KEY')}"
#     }
#     payload = {
#         "camera_id": camera_id
#     }
#
#     try:
#         response = requests.post(url, json=payload, headers=headers)
#         response.raise_for_status()  # Raises HTTPError for bad responses
#         logging.info(f"Responce in update_ai_details: {response.json()}")
#         return response.json(),response.status_code
#     except requests.exceptions.RequestException as e:
#         logging.info(f"Error in update_ai_details: {e}")
#         return None,None
