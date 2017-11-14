# A simple Flask app container.
FROM python:2.7
LABEL maintainer="Jake Boomgaarden"

# Place app in container.
ADD . /opt/src
WORKDIR /opt/src

# Install dependencies.
RUN pip install -r requirements.txt

EXPOSE 80
ENV FLASK_APP index.py
ENV FLASK_DEBUG 1
CMD python index.py
