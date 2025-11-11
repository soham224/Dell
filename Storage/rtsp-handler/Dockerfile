FROM python:3.11.3-alpine3.18
#MAINTAINER Mihir Rajput

# working direcrie
WORKDIR vfs_tusker_rtsp_handler/

COPY . .

# Install dependencies
RUN apk add ffmpeg && apk add musl-dev mariadb-dev gcc && pip install --upgrade pip

#COPY requirements.txt ./

RUN pip install -r requirements.txt

#COPY . ./

CMD python3 main.py
