# Floating Label Implementation Guide

This guide explains how to implement floating labels across all forms in the application.

## Overview

Floating labels provide a modern, user-friendly form experience where labels animate from their placeholder position to a floating position above the input field when the user focuses on the input or enters text.

## Implementation

### 1. Basic HTML Structure

```html
<div class="floating-label-container">
  <input 
    nz-input 
    formControlName="fieldName"
    placeholder=" " 
    id="fieldName" 
  />
  <label for="fieldName" class="floating-label">
    <i nz-icon nzType="user" nzTheme="outline"></i>
    Field Label <span class="required">*</span>
  </label>
</div>
```

### 2. Key Points

- **Placeholder**: Must be a single space `" "` (not empty) to trigger the floating animation
- **ID and for**: The input `id` must match the label `for` attribute
- **Required indicator**: Use `<span class="required">*</span>` for required fields
- **Icons**: Place icons inside the label element

### 3. Form Control Integration

```html
<nz-form-item>
  <nz-form-control [nzValidateStatus]="''">
    <div class="floating-label-container">
      <input 
        nz-input 
        formControlName="firstName"
        placeholder=" " 
        id="firstName" 
      />
      <label for="firstName" class="floating-label">
        <i nz-icon nzType="user" nzTheme="outline"></i>
        First Name <span class="required">*</span>
      </label>
    </div>
    <!-- Error messages go here -->
  </nz-form-control>
</nz-form-item>
```

### 4. Different Input Types

#### Text Input
```html
<div class="floating-label-container">
  <input nz-input formControlName="email" placeholder=" " id="email" />
  <label for="email" class="floating-label">
    <i nz-icon nzType="mail" nzTheme="outline"></i>
    Email Address
  </label>
</div>
```

#### Textarea
```html
<div class="floating-label-container">
  <textarea nz-input formControlName="description" placeholder=" " id="description"></textarea>
  <label for="description" class="floating-label">
    <i nz-icon nzType="file-text" nzTheme="outline"></i>
    Description
  </label>
</div>
```

#### Select Dropdown
```html
<div class="floating-label-container">
  <nz-select formControlName="country" nzPlaceHolder="Select country">
    <nz-option nzValue="US" nzLabel="United States"></nz-option>
    <nz-option nzValue="UK" nzLabel="United Kingdom"></nz-option>
  </nz-select>
  <label class="floating-label">
    <i nz-icon nzType="global" nzTheme="outline"></i>
    Country
  </label>
</div>
```

#### Date Picker
```html
<div class="floating-label-container">
  <nz-date-picker formControlName="birthDate" nzPlaceHolder="Select date"></nz-date-picker>
  <label class="floating-label">
    <i nz-icon nzType="calendar" nzTheme="outline"></i>
    Birth Date
  </label>
</div>
```

## Styling

### CSS Classes

- `.floating-label-container`: Main container for the input and label
- `.floating-label`: The animated label
- `.required`: Required field indicator (red asterisk)

### States

- **Default**: Label positioned over the input
- **Focused**: Label animates to floating position above input
- **Filled**: Label stays in floating position when input has content
- **Error**: Red border and label color
- **Success**: Green border and label color
- **Disabled**: Grayed out appearance

### Responsive Behavior

- **Desktop**: 44px height, 16px padding
- **Tablet**: 40px height, 14px padding
- **Mobile**: 36px height, 12px padding

## Examples

### Complete Form Section

```html
<div class="form-section">
  <div class="section-header-wrapper">
    <div class="header-icon">
      <i nz-icon nzType="user" nzTheme="outline"></i>
    </div>
    <div class="header-content">
      <h3 class="section-title">Personal Information</h3>
      <p class="section-subtitle">Enter your personal details</p>
    </div>
  </div>

  <div class="form-grid">
    <div class="form-row">
      <div class="form-field">
        <nz-form-item>
          <nz-form-control [nzValidateStatus]="''">
            <div class="floating-label-container">
              <input 
                nz-input 
                formControlName="firstName"
                placeholder=" " 
                id="firstName" 
              />
              <label for="firstName" class="floating-label">
                <i nz-icon nzType="user" nzTheme="outline"></i>
                First Name <span class="required">*</span>
              </label>
            </div>
            <div *ngIf="firstName?.errors && firstName?.touched" class="custom-error-message">
              <span *ngIf="firstName?.errors?.['required']">First Name is required</span>
            </div>
          </nz-form-control>
        </nz-form-item>
      </div>

      <div class="form-field">
        <nz-form-item>
          <nz-form-control [nzValidateStatus]="''">
            <div class="floating-label-container">
              <input 
                nz-input 
                formControlName="lastName"
                placeholder=" " 
                id="lastName" 
              />
              <label for="lastName" class="floating-label">
                <i nz-icon nzType="user" nzTheme="outline"></i>
                Last Name <span class="required">*</span>
              </label>
            </div>
            <div *ngIf="lastName?.errors && lastName?.touched" class="custom-error-message">
              <span *ngIf="lastName?.errors?.['required']">Last Name is required</span>
            </div>
          </nz-form-control>
        </nz-form-item>
      </div>
    </div>
  </div>
</div>
```

## Best Practices

1. **Consistent Spacing**: Use the same margin and padding across all floating label containers
2. **Icon Consistency**: Use consistent icon sizes and colors
3. **Required Fields**: Always indicate required fields with the red asterisk
4. **Error Handling**: Place error messages below the floating label container
5. **Accessibility**: Ensure proper label associations with `id` and `for` attributes
6. **Responsive Design**: Test on different screen sizes to ensure proper behavior

## Troubleshooting

### Common Issues

1. **Label not floating**: Check that placeholder is exactly one space `" "`
2. **Animation not smooth**: Ensure CSS transitions are properly loaded
3. **Styling conflicts**: Check for conflicting CSS rules from other components
4. **Mobile issues**: Verify responsive breakpoints are working correctly

### Browser Support

- **Modern Browsers**: Full support with smooth animations
- **Older Browsers**: Graceful fallback to standard label positioning
- **Mobile Browsers**: Optimized for touch interactions

## Migration Guide

### From Standard Labels

1. Remove `<nz-form-label>` elements
2. Wrap inputs in `<div class="floating-label-container">`
3. Add floating labels with proper `for` attributes
4. Set placeholder to single space `" "`
5. Update error message positioning

### From Other Floating Label Implementations

1. Ensure consistent class naming
2. Update CSS selectors if needed
3. Verify animation timing matches design system
4. Test responsive behavior

## Performance Considerations

- CSS animations use GPU acceleration for smooth performance
- Minimal DOM manipulation during label animations
- Efficient CSS selectors for better rendering performance
- Responsive breakpoints optimized for common device sizes 