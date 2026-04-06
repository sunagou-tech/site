import {
  Home, Search, Settings, Eye, EyeOff, Bell, BellOff, Menu, X, Plus, Minus,
  Check, ChevronRight, ChevronDown, ArrowRight, ExternalLink,
  User, Users, UserPlus, Heart, Star, ThumbsUp, Award, Crown,
  Briefcase, Building2, Target, TrendingUp, BarChart2, PieChart,
  DollarSign, CreditCard, ShoppingCart, Package, Truck, Globe,
  Mail, Phone, MessageCircle, MessageSquare, Send, Share2, Link, AtSign,
  FileText, BookOpen, Image, Video, Camera, Mic, Music, Download, Upload, Copy,
  Monitor, Smartphone, Laptop, Tablet, Wifi, Database, Server, Cloud, Code,
  Edit, Edit2, Trash2, RefreshCw, Save, Bookmark, Flag, Tag, Pin, Lock, Shield, Zap,
  Palette, Pen, Pencil, Scissors, Layers, Layout, Grid, Sliders,
  MapPin, Calendar, Clock, Coffee, Gift, Sun, Moon, Sparkles, Rocket, LightbulbIcon,
  CheckCircle, AlertCircle, Info, HelpCircle, ArrowUpRight, Handshake, Leaf,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Home, Search, Settings, Eye, EyeOff, Bell, BellOff, Menu, X, Plus, Minus,
  Check, ChevronRight, ChevronDown, ArrowRight, ExternalLink,
  User, Users, UserPlus, Heart, Star, ThumbsUp, Award, Crown,
  Briefcase, Building2, Target, TrendingUp, BarChart2, PieChart,
  DollarSign, CreditCard, ShoppingCart, Package, Truck, Globe,
  Mail, Phone, MessageCircle, MessageSquare, Send, Share2, Link, AtSign,
  FileText, BookOpen, Image, Video, Camera, Mic, Music, Download, Upload, Copy,
  Monitor, Smartphone, Laptop, Tablet, Wifi, Database, Server, Cloud, Code,
  Edit, Edit2, Trash2, RefreshCw, Save, Bookmark, Flag, Tag, Pin, Lock, Shield, Zap,
  Palette, Pen, Pencil, Scissors, Layers, Layout, Grid, Sliders,
  MapPin, Calendar, Clock, Coffee, Gift, Sun, Moon, Sparkles, Rocket, LightbulbIcon,
  CheckCircle, AlertCircle, Info, HelpCircle, ArrowUpRight, Handshake, Leaf,
};

export const ICON_CATEGORIES: { label: string; icons: string[] }[] = [
  {
    label: "ビジネス",
    icons: ["Briefcase", "Building2", "Target", "TrendingUp", "BarChart2", "PieChart", "DollarSign", "Award", "Crown", "Handshake", "Package", "ShoppingCart"],
  },
  {
    label: "コミュニケーション",
    icons: ["Mail", "Phone", "MessageCircle", "MessageSquare", "Send", "Share2", "Link", "Globe", "AtSign", "Bell"],
  },
  {
    label: "ユーザー・評価",
    icons: ["User", "Users", "UserPlus", "Heart", "Star", "ThumbsUp", "CheckCircle", "Shield", "Lock", "Award"],
  },
  {
    label: "コンテンツ",
    icons: ["FileText", "BookOpen", "Image", "Video", "Camera", "Mic", "Music", "Download", "Upload", "Copy", "Bookmark"],
  },
  {
    label: "テック・デバイス",
    icons: ["Monitor", "Smartphone", "Laptop", "Tablet", "Wifi", "Database", "Server", "Cloud", "Code", "Settings"],
  },
  {
    label: "ナビ・UI",
    icons: ["Home", "Search", "ArrowRight", "ChevronRight", "ExternalLink", "ArrowUpRight", "MapPin", "Calendar", "Clock", "Eye"],
  },
  {
    label: "クリエイティブ",
    icons: ["Palette", "Pen", "Pencil", "Edit", "Edit2", "Scissors", "Layers", "Layout", "Grid", "Sliders"],
  },
  {
    label: "その他",
    icons: ["Zap", "Rocket", "LightbulbIcon", "Sparkles", "Gift", "Sun", "Moon", "Coffee", "Leaf", "Flag", "Tag", "Info"],
  },
];
