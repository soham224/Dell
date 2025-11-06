FROM nvcr.io/nvidia/pytorch:20.03-py3 AS build
FROM python:3.8.13 AS final
WORKDIR tusker-dell-intrusion/
COPY . .
RUN apt update && apt-get upgrade -y && apt-get install software-properties-common -y
RUN pip install --upgrade pip
RUN pip install torch==1.9.1+cu111 torchvision==0.10.1+cu111 torchaudio==0.9.1 -f https://download.pytorch.org/whl/torch_stable.html
RUN pip install -r requirements.txt
RUN pip install torch==1.9.1+cu111 torchvision==0.10.1+cu111 torchaudio==0.9.1 -f https://download.pytorch.org/whl/torch_stable.html
#RUN pip install torch==1.9.1+cpu torchvision==0.10.1+cpu torchaudio==0.9.1 -f https://download.pytorch.org/whl/torch_stable.html
RUN apt-get update && apt-get install -y python3-opencv
RUN pip install opencv-python
COPY activation.py /usr/local/lib/python3.8/site-packages/torch/nn/modules/activation.py
CMD python app.py
