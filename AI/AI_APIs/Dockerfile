FROM python:3.8.13
WORKDIR ai-apis/
COPY . .
RUN apt update
RUN pip install --upgrade pip
RUN pip install -r requirements_latest.txt
#CMD python app.py
#CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]