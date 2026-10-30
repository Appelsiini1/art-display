# Build
FROM rocm/pytorch:latest
WORKDIR /workspace/tagger
COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir -r requirements.txt
COPY . ./
CMD ["python3", "tagger.py", "--limit", "10"]