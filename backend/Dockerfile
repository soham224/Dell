FROM python:3.8-slim-bullseye
MAINTAINER Mihir Rajput

# db config
ENV MYSQL_HOSTNAME ""
ENV MYSQL_USERNAME ""
ENV MYSQL_PASS ""
ENV MYSQL_PORT ""
ENV MYSQL_DB_NAME ""
ENV MYSQL_POOL_SIZE ""

# Install dependencies
RUN apt-get update \
    && apt-get install -y ffmpeg \
    && apt-get install default-libmysqlclient-dev python3-dev gcc -y \
    && apt-get install -y libpango1.0-0 libpangocairo-1.0-0 libcairo2 \
    && apt-get install -y libharfbuzz-dev libfribidi-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --upgrade pip

COPY autoserving-req.txt ./

RUN pip install -r autoserving-req.txt

RUN pip install --no-cache-dir backports.zoneinfo

COPY . ./

CMD uvicorn main:app --host 0.0.0.0 --port 80

