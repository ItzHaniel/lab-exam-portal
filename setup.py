#!/usr/bin/env python3
"""
Lab Exam Portal Setup Script
Creates the complete project structure and initializes the project
"""

import os
import subprocess
import sys
from pathlib import Path

def create_directory_structure():
    """Create the complete directory structure"""
    
    directories = [
        "config",
        "models", 
        "middleware",
        "routes",
        "controllers",
        "public/css",
        "public/js", 
        "public/images",
        "views",
        "student",
        "faculty", 
        "admin",
        "utils"
    ]
    
    print("🏗️  Creating project directories...")
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"   ✅ Created: {directory}/")
    
    print("📁 Directory structure created successfully!")

def create_env_file():
    """Create .env.example file"""
    
    env_content = """# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lab_exam_portal?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Application Configuration  
NODE_ENV=development
PORT=3000

# reCAPTCHA Configuration (Optional)
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"""
    
    with open(".env.example", "w") as f:
        f.write(env_content)
    
    print("📝 Created .env.example file")

def create_gitignore():
    """Create .gitignore file"""
    
    gitignore_content = """# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local

# Logs
logs/
*.log

# Vercel
.vercel

# OS generated files
.DS_Store
Thumbs.db

# IDE files
.vscode/
.idea/

# Uploaded files
public/uploads/*
!public/uploads/.gitkeep
"""
    
    with open(".gitignore", "w") as f:
        f.write(gitignore_content)
    
    print("📝 Created .gitignore file")

def install_dependencies():
    """Install Node.js dependencies"""
    
    print("📦 Installing Node.js dependencies...")
    
    try:
        result = subprocess.run(["npm", "install"], 
                              capture_output=True, 
                              text=True, 
                              timeout=300)
        
        if result.returncode == 0:
            print("   ✅ Dependencies installed successfully!")
        else:
            print("   ❌ Error installing dependencies:")
            print(f"   {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("   ❌ Node.js/npm not found. Please install Node.js first.")
        print("   📥 Download from: https://nodejs.org/")
        return False
    
    return True

def print_next_steps():
    """Print instructions for next steps"""
    
    print("\n" + "="*60)
    print("🎉 LAB EXAM PORTAL SETUP COMPLETE!")
    print("="*60)
    print("\n📋 NEXT STEPS:")
    print("\n1. Configure your environment:")
    print("   • Copy .env.example to .env")
    print("   • Update MongoDB URI in .env file")
    print("\n2. Start development server:")
    print("   npm run dev")
    print("\n3. Visit your application:")
    print("   http://localhost:3000")
    print("\n" + "="*60)

def main():
    """Main setup function"""
    
    print("🚀 Starting Lab Exam Portal Setup...\n")
    
    if not os.path.exists("package.json"):
        print("❌ package.json not found!")
        sys.exit(1)
    
    try:
        create_directory_structure()
        create_env_file()
        create_gitignore()
        install_dependencies()
        print_next_steps()
        
    except KeyboardInterrupt:
        print("\n⚠️  Setup interrupted by user.")
        sys.exit(1)

if __name__ == "__main__":
    main()
