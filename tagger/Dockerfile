# Build
FROM rocm/pytorch:latest
WORKDIR /workspace/tagger
COPY tagger ./
RUN pip install --no-cache-dir -r requirements.txt
CMD ["python", "tagger.py"]