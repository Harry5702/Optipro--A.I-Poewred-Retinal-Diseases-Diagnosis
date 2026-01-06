# OptiPro - AI-Powered Eye Disease Detection System 👁️🔬

A comprehensive web-based platform for retinal disease detection using advanced AI/ML technology with integrated doctor panel and patient management system.

## 🌟 Features

### 🩺 Complete Doctor Panel
- **Professional Authentication**: Secure signup/login with medical credentials
- **Patient Management**: Add, edit, search, and manage patient records
- **Individual Patient Profiles**: Dedicated profiles with complete medical history
- **Retinal Scan Analysis**: AI-powered diagnosis with confidence scoring
- **Visual Heatmap Analysis**: Grad-CAM visualization showing decision areas
- **Clinical Information**: Detailed diagnosis descriptions and recommendations
- **Appointment Management**: View, confirm, and manage patient appointment requests

### 👨‍⚕️ Patient Appointment System (NEW!)
- **Patient Registration**: Separate authentication system for patients
- **Doctor Discovery**: Browse available doctors with specializations
- **Appointment Booking**: Schedule appointments with preferred doctors
- **Time Slot Selection**: Choose from available morning/afternoon slots
- **Status Tracking**: Real-time appointment status updates
- **Confirmation System**: Receive confirmations when doctors approve
- **Patient Portal**: Dedicated dashboard for managing appointments

### 🧠 AI/ML Capabilities
- **Multi-Class Detection**: CNV, DME, DRUSEN, and NORMAL classification
- **High Accuracy**: ResNet-101 based neural network
- **Interpretable Results**: Grad-CAM heatmaps for transparent diagnosis
- **Confidence Scoring**: Reliability percentage for each prediction
- **Clinical Context**: Comprehensive information for each condition

### 💾 Advanced Data Management
- **Supabase Integration**: Cloud database with real-time capabilities
- **Secure Storage**: Patient data and medical images stored securely
- **Row-Level Security**: Doctor-patient data isolation
- **Audit Trail**: Complete history of all scans and patient interactions
- **Data Export**: Easy access to patient reports and scan history
- **Dual Storage**: Supabase + LocalStorage fallback for reliability

### 🎨 Modern User Experience
- **Beautiful Interface**: Modern gradients and animations using Framer Motion
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy-to-use doctor panel with clear workflows
- **Real-time Notifications**: Toast notifications for user feedback
- **Dark/Light Mode**: Customizable appearance (optional)
- **Session Management**: Automatic timeout and security features

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- Supabase account (free tier sufficient)

### 1. Clone and Install
```bash
git clone <repository-url>
cd OptiPro

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies  
cd ../
pip install -r requirements.txt
```

### 2. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and API key
3. Update `frontend/.env` with your credentials:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```
4. Run the SQL schema from `supabase_schema.sql` in your Supabase dashboard
5. Create storage buckets: `retinal-images` and `heatmap-images`

### 3. Start the Application
```bash
# Terminal 1: Backend
python app.py

# Terminal 2: Frontend
cd frontend
npm start
```

### 4. Access the System
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **First Time**: Create a doctor account through the signup form

## 📁 Project Structure

```
OptiPro/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/          # Main application pages
│   │   ├── lib/            # Utilities and configurations
│   │   └── App.js          # Main application component
│   └── public/             # Static assets
├── backend/
│   ├── app.py              # Flask API server
│   ├── best_model.pth      # Trained AI model
│   └── static/             # Uploaded images and results
├── supabase_schema.sql     # Database schema
├── SUPABASE_SETUP.md      # Detailed setup instructions
└── PROJECT_OVERVIEW.md    # Comprehensive project documentation
```

## 🏥 User Journey

### For Medical Professionals

1. **👨‍⚕️ Registration**: Sign up with medical credentials (name, specialization, license)
2. **🔐 Secure Login**: Access your personalized doctor panel
3. **📊 Dashboard**: View patient statistics and quick actions
4. **👥 Patient Management**: 
   - Add new patients with medical history
   - Search and filter patient records
   - View individual patient profiles
5. **🔬 Retinal Analysis**:
   - Select a patient for scanning
   - Upload retinal images
   - Get AI-powered diagnosis with confidence scores
   - Review heatmap visualizations
   - Add clinical notes
6. **📈 Progress Tracking**: Monitor patient scan history and trends

## 🧬 AI Technology

### Model Architecture
- **Base**: ResNet-101 Convolutional Neural Network
- **Classes**: 4 retinal conditions (CNV, DME, DRUSEN, NORMAL)
- **Input**: 224x224 pixel retinal images
- **Output**: Classification with confidence percentage

### Grad-CAM Visualization
- **Purpose**: Shows which areas of the retina influenced the AI decision
- **Implementation**: Gradient-based class activation mapping
- **Benefit**: Provides interpretable, transparent AI diagnosis

### Supported Conditions
- **CNV**: Choroidal Neovascularization
- **DME**: Diabetic Macular Edema  
- **DRUSEN**: Early AMD indicator deposits
- **NORMAL**: Healthy retina

## 🔒 Security & Privacy

- **Data Isolation**: Row-level security ensures doctors only access their patients
- **Authentication**: Secure login required for all operations
- **HIPAA Considerations**: Designed with medical data privacy in mind
- **Audit Trails**: Complete logging of all system activities
- **Secure Storage**: All data encrypted and stored in Supabase cloud

## 📱 Technology Stack

- **Frontend**: React 19, React Router, Framer Motion, Axios
- **Backend**: Flask, PyTorch, OpenCV, NumPy
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI/ML**: ResNet-101, Grad-CAM, Custom training pipeline
- **UI/UX**: Modern CSS3, React Icons, React Hot Toast

## 🛠️ Development

### Adding New Features
1. Frontend components in `frontend/src/components/`
2. New pages in `frontend/src/pages/`
3. API endpoints in `app.py`
4. Database changes in Supabase dashboard

### Customization
- Modify colors and themes in CSS files
- Add new AI models by updating `app.py`
- Extend database schema as needed
- Customize doctor panel workflows

## 🚢 Deployment

### Production Checklist
- [ ] Set up production Supabase project
- [ ] Configure environment variables securely
- [ ] Implement password hashing (bcrypt)
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Test all user workflows

### Hosting Options
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: Heroku, Google Cloud Run, AWS EC2
- **Database**: Supabase (managed)

## � Appointment System

### For Patients
1. Visit `/patient-portal`
2. Register with your details
3. Browse available doctors
4. Book appointment with preferred time slot
5. Track appointment status in real-time

### For Doctors
1. Login to doctor panel
2. View appointment requests
3. Confirm or cancel appointments
4. Add notes for patients
5. Manage your schedule

### Available Time Slots
- Morning: 9:00 AM - 11:30 AM
- Afternoon: 2:00 PM - 5:00 PM
- 30-minute intervals

### Appointment Statuses
- 🟡 **Pending**: Awaiting doctor approval
- 🟢 **Confirmed**: Appointment accepted
- 🔴 **Cancelled**: Appointment cancelled
- 🔵 **Completed**: Appointment finished

## 👁️ GUI 
<img width="1351" height="611" alt="Hero Section" src="https://github.com/user-attachments/assets/f961990d-1ea4-4efd-b233-3d54d2dec88d" />
<img width="1349" height="605" alt="Dark Mode" src="https://github.com/user-attachments/assets/7bff0984-8b69-45c5-8e12-be48e4a6a5ec" />
<img width="1352" height="600" alt="About Section" src="https://github.com/user-attachments/assets/62fdbe11-afd4-47ba-9134-36200ea1eb93" />
<img width="1348" height="596" alt="Features Section" src="https://github.com/user-attachments/assets/dc22f577-70be-4455-9a52-a9dbfc05bee9" 
<img width="1338" height="484" alt="Contact US Page 1" src="https://github.com/user-attachments/assets/1bb3962f-c54c-4986-bdc6-affe58d80633" />
<img width="1338" height="601" alt="Contact Us page 2" src="https://github.com/user-attachments/assets/2bc4744c-97a3-4d75-8d59-bcacd2f768b3" />
<img width="498" height="539" alt="Doctor Login Page" src="https://github.com/user-attachments/assets/df06d969-1d7c-4d57-b065-0ec0b9c8b31e" />
<img width="1349" height="607" alt="Doctor Panel 1" src="https://github.com/user-attachments/assets/9adbcb5d-36ed-40ef-bb3d-1b941ec7df21" />
<img width="1349" height="613" alt="Doctor Panel 2" src="https://github.com/user-attachments/assets/10194da9-d952-4aac-b36e-32484a653d5a" />
<img width="1347" height="597" alt="Doctor Panel 3" src="https://github.com/user-attachments/assets/037d2e97-092a-43bc-afa5-13ac814096ef" />
<img width="1351" height="611" alt="Patient Record in Doctor panel" src="https://github.com/user-attachments/assets/43c08121-4f73-446d-bcab-d0a234544bf5" />
<img width="1193" height="544" alt="Patient Complete Medical Info 1" src="https://github.com/user-attachments/assets/672a9536-e252-4334-9b65-d2643ecdcff5" />
<img width="1197" height="512" alt="Patient Complete Medical Info 2" src="https://github.com/user-attachments/assets/6e984b9c-9da0-4b8b-a5f6-cdb5be7a955d" />
<img width="816" height="586" alt="Patient Report pdf 1" src="https://github.com/user-attachments/assets/b33cca7a-6f1d-4088-9cbf-52ea6ae13204" />
<img width="815" height="431" alt="Patient Report pdf 2" src="https://github.com/user-attachments/assets/32cf7188-b16e-4d82-b20c-55e49f1d1f21" />



















## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues for bug reports and feature requests
- **Documentation**: Check PROJECT_OVERVIEW.md for detailed information
- **Setup Help**: Refer to SUPABASE_SETUP.md for configuration assistance

## 🎯 Future Roadmap

### Appointment System Enhancements
- [ ] Email/SMS notifications for appointments
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Video consultation integration
- [ ] Payment processing for consultations
- [ ] Appointment rescheduling
- [ ] Recurring appointments

### Core Features
- [ ] Mobile application (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with EMR systems
- [ ] Multi-language support
- [ ] Telemedicine features
- [ ] Additional AI models for more conditions

---

**OptiPro** - Revolutionizing eye care through AI technology 🌟

*Built with ❤️ for medical professionals and their patients*
