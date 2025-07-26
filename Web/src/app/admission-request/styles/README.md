# Admission Request Module - Common Styles

This directory contains shared styles for the Admission Request Module to ensure consistency and reduce code duplication.

## File Structure

```
styles/
├── common.scss          # Main common styles file
└── README.md           # This documentation
```

## Usage

### 1. Import in Component SCSS

```scss
// In your component's .scss file
@import '../styles/common.scss';

.my-component {
  @extend .page-container;
  
  .header {
    @extend .section-header;
  }
  
  .content {
    @extend .content-card;
  }
}
```

### 2. Use Mixins

```scss
.my-button {
  @include button-primary;
}

.my-card {
  @include card-base;
  @include card-hover;
}

.my-icon {
  @include icon-primary;
}
```

### 3. Use Variables

```scss
.my-element {
  color: $primary-color;
  padding: $spacing-lg;
  border-radius: $border-radius-md;
  box-shadow: $shadow-md;
}
```

## Available Components

### Layout Components
- `.page-container` - Main page wrapper
- `.section-header` - Section header with gradient background
- `.content-card` - Standard content card with hover effects

### List Components
- `.list-item` - Standard list item with icon, content, and number

### Form Components
- `.form-section` - Form section wrapper
- `.form-group` - Form field group

### Button Components
- `.btn` - Base button styles
- `.btn-secondary` - Secondary button variant
- `.btn-success` - Success button variant
- `.btn-warning` - Warning button variant
- `.btn-danger` - Danger button variant

### Alert Components
- `.alert` - Base alert styles
- `.alert-info` - Info alert variant
- `.alert-success` - Success alert variant
- `.alert-warning` - Warning alert variant
- `.alert-danger` - Danger alert variant

### Utility Components
- `.loading` - Loading state
- `.empty-state` - Empty state display

## Available Mixins

### Layout Mixins
- `@mixin flex-center` - Center flex items
- `@mixin flex-between` - Space between flex items
- `@mixin flex-start` - Start flex items
- `@mixin flex-column` - Column flex direction

### Background Mixins
- `@mixin gradient-primary` - Primary gradient background
- `@mixin gradient-light` - Light gradient background
- `@mixin gradient-card` - Card gradient background

### Component Mixins
- `@mixin card-base` - Base card styles
- `@mixin card-hover` - Card hover effects
- `@mixin button-primary` - Primary button styles
- `@mixin icon-base` - Base icon styles
- `@mixin icon-primary` - Primary icon styles

### Animation Mixins
- `@mixin fade-in-up($delay)` - Fade in up animation
- `@mixin scale-hover` - Scale hover effect

## Available Variables

### Colors
- `$primary-color` - Primary blue (#1890ff)
- `$primary-light` - Light primary (#40a9ff)
- `$primary-dark` - Dark primary (#096dd9)
- `$success-color` - Success green (#52c41a)
- `$warning-color` - Warning orange (#fa8c16)
- `$error-color` - Error red (#f5222d)
- `$text-primary` - Primary text (#262626)
- `$text-secondary` - Secondary text (#595959)
- `$text-muted` - Muted text (#8c8c8c)

### Spacing
- `$spacing-xs` - Extra small (4px)
- `$spacing-sm` - Small (8px)
- `$spacing-md` - Medium (16px)
- `$spacing-lg` - Large (24px)
- `$spacing-xl` - Extra large (32px)
- `$spacing-xxl` - Extra extra large (48px)

### Border Radius
- `$border-radius-sm` - Small (6px)
- `$border-radius-md` - Medium (8px)
- `$border-radius-lg` - Large (12px)
- `$border-radius-xl` - Extra large (16px)

### Shadows
- `$shadow-sm` - Small shadow
- `$shadow-md` - Medium shadow
- `$shadow-lg` - Large shadow
- `$shadow-hover` - Hover shadow

### Typography
- `$font-size-xs` through `$font-size-xxxl` - Font sizes
- `$font-weight-normal` through `$font-weight-bold` - Font weights
- `$line-height-tight`, `$line-height-normal`, `$line-height-relaxed` - Line heights

## Responsive Design

The common styles include responsive mixins:

```scss
@include mobile {
  // Mobile-specific styles
}

@include tablet {
  // Tablet-specific styles
}

@include desktop {
  // Desktop-specific styles
}
```

## Utility Classes

### Spacing Utilities
- `.mt-0` through `.mt-5` - Margin top
- `.mb-0` through `.mb-5` - Margin bottom
- `.p-0` through `.p-5` - Padding

### Text Utilities
- `.text-center`, `.text-left`, `.text-right` - Text alignment
- `.text-primary`, `.text-secondary`, `.text-muted` - Text colors
- `.font-bold`, `.font-semibold`, `.font-medium`, `.font-normal` - Font weights

### Display Utilities
- `.d-none`, `.d-block`, `.d-flex`, `.d-inline`, `.d-inline-block` - Display
- `.justify-center`, `.justify-between`, `.justify-start`, `.justify-end` - Justify content
- `.align-center`, `.align-start`, `.align-end` - Align items

## Best Practices

1. **Always import common styles first** in your component SCSS files
2. **Use extends for layout components** to maintain consistency
3. **Use mixins for interactive elements** like buttons and cards
4. **Use variables for colors and spacing** to maintain design consistency
5. **Test responsive behavior** using the provided mixins
6. **Follow the naming conventions** established in the common styles

## Adding New Styles

When adding new styles to the common file:

1. **Use existing variables** when possible
2. **Create new variables** if needed for consistency
3. **Add mixins** for reusable patterns
4. **Include responsive variants** using the mobile/tablet/desktop mixins
5. **Document new additions** in this README

## Example Component

Here's an example of how to use the common styles in a component:

```scss
@import '../styles/common.scss';

.example-component {
  @extend .page-container;
  
  .header {
    @extend .section-header;
    
    .header-content {
      .header-text {
        .title {
          @extend .section-title;
        }
        
        .subtitle {
          @extend .section-subtitle;
        }
      }
    }
  }
  
  .content {
    @extend .content-card;
    
    .list {
      .item {
        @extend .list-item;
        @include fade-in-up;
        
        &:nth-child(1) { animation-delay: 0.1s; }
        &:nth-child(2) { animation-delay: 0.2s; }
      }
    }
  }
  
  .button {
    @include button-primary;
  }
}
``` 