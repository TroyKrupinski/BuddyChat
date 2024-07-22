import os
import time
import torch
from torchvision import transforms
from PIL import Image
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import pytorch_lightning as pl
from transformers import BeitForImageClassification, AdamW
import torch.nn as nn


id2label = {0: 'angry',
 1: 'disgust',
 2: 'fear',
 3: 'happy',
 4: 'neutral',
 5: 'sad',
 6: 'surprise'}

label2id = {'angry':0,
 'disgust':1,
 'fear':2,
 'happy':3,
 'neutral':4,
 'sad':5,
 'surprise':6}

class BEITLightningModule(pl.LightningModule):
    def __init__(self, num_labels=7):
        super(BEITLightningModule, self).__init__()
        
        self.beit = BeitForImageClassification.from_pretrained('microsoft/beit-base-patch16-224-pt22k-ft22k',
                                                              num_labels=7,
                                                              id2label=id2label,
                                                              label2id=label2id,
                                                              ignore_mismatched_sizes=True)

    def forward(self, pixel_values):
        outputs = self.beit(pixel_values=pixel_values)
        return outputs.logits
        
    def common_step(self, batch, batch_idx):
        pixel_values = batch['pixel_values']
        labels = batch['labels']
        logits = self(pixel_values)

        criterion = nn.CrossEntropyLoss()
        loss = criterion(logits, labels)
        predictions = logits.argmax(-1)
        correct = (predictions == labels).sum().item()
        accuracy = correct/pixel_values.shape[0]

        return loss, accuracy
      
    def training_step(self, batch, batch_idx):
        loss, accuracy = self.common_step(batch, batch_idx)     
        # logs metrics for each training_step,
        # and the average across the epoch
        self.log("training_loss", loss)
        self.log("training_accuracy", accuracy)

        return loss
    
    def validation_step(self, batch, batch_idx):
        loss, accuracy = self.common_step(batch, batch_idx)     
        self.log("validation_loss", loss, on_epoch=True)
        self.log("validation_accuracy", accuracy, on_epoch=True)

        return loss

    def test_step(self, batch, batch_idx):
        loss, accuracy = self.common_step(batch, batch_idx)     

        return loss

    def configure_optimizers(self):
        # We could make the optimizer more fancy by adding a scheduler and specifying which parameters do
        # not require weight_decay but just using AdamW out-of-the-box works fine
        return AdamW(self.parameters(), lr=5e-5)

    def train_dataloader(self):
        return train_dataloader

    def val_dataloader(self):
        return val_dataloader

    def test_dataloader(self):
        return test_dataloader
# Load the model
model = BEITLightningModule()
model.load_state_dict(torch.load('./src/components/beit_model_pytorch_lightning2.pth'))
model.eval()  # Set the model to evaluation mode

# Define the image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Define the directory to watch and the directory to save predictions
watch_directory = './images'
save_directory = './predictions'

if not os.path.exists(save_directory):
    os.makedirs(save_directory)

class ImageHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return None

        if event.src_path.endswith(('.png', '.jpg', '.jpeg')):
            image_path = event.src_path
            image_name = os.path.basename(image_path)
            print(f'New image detected: {image_name}')

            # Load the image
            image = Image.open(image_path).convert('RGB')
            image = transform(image)
            image = image.unsqueeze(0)  # Add batch dimension

            # Make prediction
            with torch.no_grad():
                outputs = model(image)
                _, predicted = torch.max(outputs, 1)
                predicted_label = predicted.item()
                emotion = id2label[predicted_label]

            # Save the prediction
            prediction_path = os.path.join(save_directory, f'{image_name}.txt')
            with open(prediction_path, 'w') as f:
                f.write(str(emotion))
            print(f'Saved prediction: {predicted_label} to {prediction_path}')

# Set up the observer
event_handler = ImageHandler()
observer = Observer()
observer.schedule(event_handler, path=watch_directory, recursive=False)
observer.start()

print(f'Watching directory: {watch_directory} for new images...')

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    observer.stop()
observer.join()

