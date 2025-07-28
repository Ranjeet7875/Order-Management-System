const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const Collection = require("./config/DB");
const router = require("./routes/orderRoutes");
const Inventory = require("./routes/inventoryRoutes");
const rateLimit = require('express-rate-limit');
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
  cors: { 
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  } 
});

// Manual CORS Headers - Add this BEFORE other middleware
app.use((req, res, next) => {
  // Allow requests from your frontend origins
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json());
Collection();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.get("/", (req, res) => {
  res.json("Order management System");
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/osm", router);
app.use("/inventory", Inventory);

// Make io available in controllers
app.set('io', io);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server Started on port 3001");
});