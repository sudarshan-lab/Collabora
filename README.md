

# Collabora App

## Description

Collabora App is a web-based application hosted on Google Cloud Platform (GCP), designed to allow users to collaborate and interact with various documents and data. This app provides real-time collaboration features to users, making it an ideal solution for businesses or teams working together remotely.

## Live Demo

You can access the app by visiting the following URL:

[**Collabora App**](http://34.132.245.252:5173/)

This will open the page where you can interact with the app.

---

## Features

- **Real-time collaboration**: Users can interact with shared documents simultaneously.
- **User-friendly interface**: A simple and intuitive design to facilitate easy collaboration.
- **Responsive**: Optimized and fully responsive web app.
- **Access Control**: Role-based user management.

---

## Setup Instructions (for local development)

### Step 1: Clone the repository

```bash
git clone https://github.com/sudarshan-lab/Collabora.git
cd collabora-app
```

### Step 2: Install dependencies

Make sure you have `npm` installed, then run:

```bash
npm install
```

### Step 3: Run the app locally

```bash
npm run dev
```

This will start the app on `http://localhost:5173`. Open the URL in your browser to start viewing the app.

---

## Technologies Used

- **Frontend**: React, Vite, TailwindCSS.
- **Backend**: Node.js.
- **Deployment**: Google Cloud Platform (GCP), PM2 (for process management).

---

# Deployment Instructions for Collabora frontend on GCP VM

## Step 1: Set up a Google Cloud VM instance

1. Create a new Virtual Machine (VM) instance on Google Cloud Platform (GCP) via the Google Cloud Console.
2. Choose an appropriate machine type and image (e.g., Ubuntu 20.04 or Debian).
3. Open the required ports (5173) for the app on the GCP firewall.

---

## Step 2: Install Node.js, npm, Git, and PM2 on the VM

### 1. Update the package list

```bash
sudo apt update
```

### 2. Install Node.js 

```bash
sudo apt install -y nodejs
```

### 3. Install Git

```bash
sudo apt install git
```

### 4. Install PM2 globally for process management

```bash
sudo npm install -g pm2
```

---

## Step 3: Transfer your project to the VM

### 1. Clone the repository from GitHub

```bash
git clone https://github.com/sudarshan-lab/Collabora.git
cd Collabora/frontend
```

---

## Step 4: Install project dependencies

```bash
npm install
```

---

## Step 5: Run the app using PM2

### 1. Start the app with PM2 to keep it running

```bash
pm2 start "npm run dev" --name "vite-app"
```

---

## Step 6: Open required ports in GCP firewall

1. Go to the **Google Cloud Console** > **VPC network** > **Firewall rules**.
2. Create a new rule to allow inbound traffic on port 5173.

---

## Step 7: Access the app

You can now access the app on your VM's external IP:

```bash
http://<YOUR_VM_EXTERNAL_IP>:5173
```
