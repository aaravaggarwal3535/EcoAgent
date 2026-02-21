#!/bin/bash
# Install script for EcoAgent with YOLOv8 detection

echo "🔧 Installing EcoAgent dependencies..."

# Navigate to backend directory
cd /workspaces/EcoAgent/backend || exit 1

# Remove conflicting OpenCV packages
echo "🗑️  Removing conflicting OpenCV packages..."
pip uninstall -y opencv-python opencv-contrib-python 2>/dev/null || true

echo "📦 Installing requirements..."
pip install -r requirements.txt

echo ""
echo "✅ Installation complete!"
echo ""
echo "Testing YOLOv8 import..."
python3 -c "from ultralytics import YOLO; print('✓ YOLOv8 ready')" && echo "✓ OpenCV ready" || echo "⚠️  Warning: Import test failed, but installation may complete during first use"

echo ""
echo "🚀 To start the backend server, run:"
echo "   python main.py"
