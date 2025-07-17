# app/ml/prediction.py
import io
from PIL import Image
from ultralytics import YOLO
import logging

class YoloPredictionService:
    def __init__(self, model_path: str):
        self.model = YOLO(model_path)
        logger = logging.getLogger(__name__)
        logger.info(f"YOLO model '{model_path}' loaded successfully.")

    def predict_classify(self, image_bytes: bytes) -> str:
        """
        ทำนายผลแบบ Classification (คืนค่าเป็นชื่อคลาสเดียว)
        """
        logger = logging.getLogger(__name__)
        logger.info("Running YOLO classification prediction.")
        image = Image.open(io.BytesIO(image_bytes))
        results = self.model(image)
        probs = results[0].probs
        class_name = self.model.names[probs.top1]
        return class_name