# Dashboard Styles Centralization Guide

## Overview
This guide provides instructions for applying the centralized dashboard styles to all administrative dashboard components. The styles use the customer UI color scheme with cosmic colors for consistency.

## Color Scheme
- **Primary Gold**: `#FFD700` (starlight-gold) - Used for titles, active states, and primary buttons
- **Silver**: `#C0C0C0` (nebula-silver) - Used for secondary text and borders
- **Cosmic Navy**: `#191970` - Used for backgrounds and cards
- **Cosmic Black**: `#0a0a23` - Used for main background
- **White**: `#EAEAEA` - Used for primary text

## Available Dashboard Classes

### 1. Container & Layout
```tsx
<div className="dashboard-container p-6 space-y-6">
  {/* Your dashboard content */}
</div>
```

### 2. Cards
```tsx
<Card className="dashboard-card">
  <CardHeader>
    <CardTitle className="dashboard-card-title">Title</CardTitle>
    <CardDescription className="dashboard-card-description">Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### 3. Typography
```tsx
<h2 className="dashboard-text-primary text-3xl font-bold">Primary Title</h2>
<p className="dashboard-text-secondary">Secondary text</p>
<span className="dashboard-text-muted">Muted text</span>
<span className="dashboard-text-accent">Accent text (gold)</span>
```

### 4. Buttons
```tsx
<Button className="dashboard-button-primary">Primary Button</Button>
<Button variant="outline" className="dashboard-button-outline">Outline Button</Button>
<Button variant="outline" className="dashboard-button-secondary">Secondary Button</Button>
<Button variant="outline" className="dashboard-button-danger">Danger Button</Button>
```

### 5. Form Elements
```tsx
<Label className="dashboard-label">Form Label</Label>
<Input className="dashboard-input" placeholder="Enter text..." />
<Select>
  <SelectTrigger className="dashboard-select">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent className="dashboard-dropdown-content">
    <SelectItem value="option" className="dashboard-dropdown-item">Option</SelectItem>
  </SelectContent>
</Select>
<Textarea className="dashboard-textarea" placeholder="Enter text..." />
```

### 6. Badges
```tsx
<Badge className="dashboard-badge">Default Badge</Badge>
<Badge className="dashboard-badge-success">Success Badge</Badge>
<Badge className="dashboard-badge-warning">Warning Badge</Badge>
<Badge className="dashboard-badge-error">Error Badge</Badge>
<Badge className="dashboard-badge-info">Info Badge</Badge>
<Badge className="dashboard-badge-gold">Gold Badge</Badge>
```

### 7. Tables
```tsx
<table className="dashboard-table">
  <thead className="dashboard-table-header">
    <tr>
      <th>Header</th>
    </tr>
  </thead>
  <tbody>
    <tr className="dashboard-table-row">
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

### 8. Modals
```tsx
<div className="dashboard-modal">
  <div className="dashboard-modal-content">
    <div className="dashboard-modal-header">
      <h3 className="dashboard-modal-title">Modal Title</h3>
      <p className="dashboard-modal-description">Modal description</p>
    </div>
    {/* Modal content */}
  </div>
</div>
```

### 9. Stats Cards
```tsx
<Card className="dashboard-stats-card">
  <CardHeader>
    <CardTitle className="dashboard-stats-label">Stat Label</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="dashboard-stats-value">123</div>
    <p className="dashboard-stats-label">Description</p>
  </CardContent>
</Card>
```

### 10. Filter Sections
```tsx
<div className="dashboard-filter-section">
  <div className="dashboard-filter-grid">
    <div className="dashboard-filter-item">
      <Label className="dashboard-filter-label">Filter Label</Label>
      {/* Filter input */}
    </div>
  </div>
</div>
```

### 11. Tabs
```tsx
<Tabs className="dashboard-tabs">
  <TabsList className="dashboard-tabs-list">
    <TabsTrigger className="dashboard-tabs-trigger">Tab 1</TabsTrigger>
    <TabsTrigger className="dashboard-tabs-trigger">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent className="dashboard-tabs-content">
    {/* Tab content */}
  </TabsContent>
</Tabs>
```

### 12. Status Indicators
```tsx
<span className="dashboard-status-active">Active</span>
<span className="dashboard-status-pending">Pending</span>
<span className="dashboard-status-inactive">Inactive</span>
```

### 13. Loading & Empty States
```tsx
{loading ? (
  <div className="dashboard-loading">
    <div className="dashboard-loading-spinner">Loading...</div>
  </div>
) : data.length === 0 ? (
  <div className="dashboard-empty">
    <div className="dashboard-empty-icon">No data found</div>
  </div>
) : (
  /* Your data display */
)}
```

### 14. Pagination
```tsx
<div className="dashboard-pagination">
  <Button className="dashboard-pagination-button">Previous</Button>
  <Button className="dashboard-pagination-button active">1</Button>
  <Button className="dashboard-pagination-button">Next</Button>
</div>
```

### 15. Alerts
```tsx
<div className="dashboard-alert dashboard-alert-success">Success message</div>
<div className="dashboard-alert dashboard-alert-warning">Warning message</div>
<div className="dashboard-alert dashboard-alert-error">Error message</div>
<div className="dashboard-alert dashboard-alert-info">Info message</div>
```

## Components to Update

### ✅ Already Updated
- `RatesManagement.tsx` - Fully updated with centralized styles

### 🔄 Need to Update
1. **BookingsManagement.tsx**
2. **SoulPackagesManagement.tsx**
3. **ClientManagement.tsx**
4. **EmailManagement.tsx**
5. **ContentManagement.tsx**
6. **ScheduleManagement.tsx**
7. **ImageManagement.tsx**
8. **LogoManagement.tsx**
9. **SeoManagement.tsx**
10. **PurchaseHistoryManagement.tsx**
11. **SettingsManagement.tsx**
12. **AdminDashboard.tsx**

## Step-by-Step Update Process

### Step 1: Update Container
```tsx
// Before
<div className="space-y-6">

// After
<div className="dashboard-container p-6 space-y-6">
```

### Step 2: Update Headers
```tsx
// Before
<h2 className="text-3xl font-bold tracking-tight">Component Title</h2>
<p className="text-muted-foreground">Description</p>

// After
<h2 className="dashboard-text-primary text-3xl font-bold tracking-tight">Component Title</h2>
<p className="dashboard-text-secondary">Description</p>
```

### Step 3: Update Buttons
```tsx
// Before
<Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
<Button variant="outline" className="text-red-600 hover:text-red-700">

// After
<Button className="dashboard-button-primary">
<Button variant="outline" className="dashboard-button-danger">
```

### Step 4: Update Cards
```tsx
// Before
<Card>
<CardTitle>Title</CardTitle>
<CardDescription>Description</CardDescription>

// After
<Card className="dashboard-card">
<CardTitle className="dashboard-card-title">Title</CardTitle>
<CardDescription className="dashboard-card-description">Description</CardDescription>
```

### Step 5: Update Form Elements
```tsx
// Before
<Label>Label</Label>
<Input />
<Select>
  <SelectTrigger>
  <SelectContent>

// After
<Label className="dashboard-label">Label</Label>
<Input className="dashboard-input" />
<Select>
  <SelectTrigger className="dashboard-select">
  <SelectContent className="dashboard-dropdown-content">
```

### Step 6: Update Text Colors
```tsx
// Before
<span className="text-muted-foreground">Text</span>
<span className="font-medium">Text</span>

// After
<span className="dashboard-text-muted">Text</span>
<span className="dashboard-text-primary font-medium">Text</span>
```

### Step 7: Update Badges
```tsx
// Before
<Badge variant="secondary">Status</Badge>

// After
<Badge variant="secondary" className="dashboard-badge">Status</Badge>
```

## Example: Complete Component Update

### Before
```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Component Title</h2>
      <p className="text-muted-foreground">Description</p>
    </div>
    <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
      New Item
    </Button>
  </div>
  
  <Card>
    <CardHeader>
      <CardTitle>Filters</CardTitle>
    </CardHeader>
    <CardContent>
      <Label>Filter Label</Label>
      <Input />
    </CardContent>
  </Card>
</div>
```

### After
```tsx
<div className="dashboard-container p-6 space-y-6">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="dashboard-text-primary text-3xl font-bold tracking-tight">Component Title</h2>
      <p className="dashboard-text-secondary">Description</p>
    </div>
    <Button className="dashboard-button-primary">
      New Item
    </Button>
  </div>
  
  <Card className="dashboard-card">
    <CardHeader>
      <CardTitle className="dashboard-card-title">Filters</CardTitle>
    </CardHeader>
    <CardContent>
      <Label className="dashboard-label">Filter Label</Label>
      <Input className="dashboard-input" />
    </CardContent>
  </Card>
</div>
```

## Benefits of Centralization

✅ **Consistency** - All components use the same color scheme and styling
✅ **Maintainability** - Colors and styles defined in one place
✅ **Customer UI Match** - Dashboard matches the customer-facing website design
✅ **Scalability** - Easy to add new components with consistent styling
✅ **Theme Support** - Easy to modify entire dashboard theme
✅ **Professional Look** - Unified, polished appearance across all admin components

## Next Steps

1. Update each component following the patterns above
2. Test the visual consistency across all dashboard components
3. Ensure all form elements, buttons, and interactive elements use the correct classes
4. Verify that the color scheme matches the customer website
5. Test responsiveness and accessibility of the new styles

## Notes

- All dashboard classes are prefixed with `dashboard-` for easy identification
- The styles use CSS custom properties for consistent color values
- Hover states and transitions are included for better user experience
- The styles are designed to work with the existing Tailwind CSS framework
- All components should maintain their existing functionality while updating only the styling
