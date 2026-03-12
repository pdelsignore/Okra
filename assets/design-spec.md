# Design Specification: Profit.co Dashboard

**Project:** Modern SaaS Dashboard (KPI & Analytics)  
**Version:** 1.0  
**Theme:** Light Mode / Clean Enterprise  

---

## 🎨 1. Color Palette

### **Brand & Primary Colors**
* **Action Blue:** `#3D7BFF` (Primary Buttons, Active Icons, Progress Bars)
* **Deep Navy:** `#0E1B3D` (Active Tab Backgrounds, Primary Headings, Text)
* **Active Tint:** `#E9F0FF` (Background for active sidebar items)

### **Interface Colors**
* **Main Background:** `#F4F7FE` (Page-wide background)
* **Card Background:** `#FFFFFF` (Widget and module containers)
* **Border/Divider:** `#F2F2F2` (Table row separators and card strokes)

### **Status & Data Colors**
* **Positive (Success):** `#27AE60` (Trends and positive indicators)
* **Negative (Alert):** `#EB5757` (Downward trends and warnings)
* **Secondary Data (Violet):** `#6C5DD3` (Enquiry bars/Alternative data series)
* **Tertiary Data (Light Blue):** `#56CCF2` (Secondary chart elements)

---

## 🔠 2. Typography

**Recommended Typeface:** *Inter*, *Plus Jakarta Sans*, or *Poppins* (Geometric Sans-Serif).

| Element | Size | Weight | Color |
| :--- | :--- | :--- | :--- |
| **Page Title** | 24px | Bold (700) | `#0E1B3D` |
| **KPI Metrics** | 28px | Extra Bold (800) | `#0E1B3D` |
| **Widget Headers** | 18px | Bold (700) | `#0E1B3D` |
| **Sidebar Labels** | 14px | Medium (500) | `#828282` |
| **Body / Table Text** | 13px | Regular (400) | `#0E1B3D` |
| **Small Captions** | 12px | Regular (400) | `#828282` |

---

## 📐 3. Layout & Components

### **Container Specs**
* **Border Radius:** 16px (Standard for cards and large buttons).
* **Card Padding:** 24px internal spacing (all sides).
* **Drop Shadow:** `0px 4px 20px rgba(0, 0, 0, 0.05)` (Very soft, high blur).

### **Navigation (Sidebar)**
* **Width:** 240px.
* **Icon Style:** Linear / Outline (2px stroke).
* **Active State:** Rounded pill shape background (`#E9F0FF`) with primary blue text/icon.

### **Interactive Elements**
* **Primary Button:** Pill-shaped, `#3D7BFF` background, White text, 12px horizontal padding.
* **Search Input:** Fully rounded (pill), `#F4F7FE` background, centered icon.
* **Toggle/Tabs:** Grouped pill-style buttons. Active uses `#0E1B3D` with white text.

---

## 📊 4. Data Visualization Guidelines

* **Bar Charts:** Grouped bars with rounded top corners (radius: 4px).
* **Donut Charts:** 40px stroke width with rounded ends for data segments.
* **Line Charts:** Smooth "spline" curves with a soft 10% opacity gradient fill below the line.
* **Trend Indicators:** Small pill backgrounds for percentage changes (e.g., Light Green background for `#27AE60` text).

---

## 🛠️ 5. Table Styling
* **Header:** Light gray text, uppercase, 11px-12px.
* **Row Height:** 64px.
* **Dividers:** 1px solid `#F2F2F2` (No vertical lines).
* **Images:** Thumbnail icons for products should have a 4px-8px border radius.