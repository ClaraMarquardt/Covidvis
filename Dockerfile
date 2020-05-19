FROM python:3.7
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt

EXPOSE 5000
ENV FLASK_APP application.py
ENTRYPOINT ["python", "-m", "flask", "run", "--host=0.0.0.0"]
