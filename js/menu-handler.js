// Circular menu handler for navigation
document.addEventListener('DOMContentLoaded', function() {
  const menuItems = document.querySelectorAll('.menu-item');
  
  console.log('Initializing circular menu items:', menuItems.length);
  
  menuItems.forEach((item, index) => {
    // Add click event listener as backup
    item.addEventListener('click', function(e) {
      console.log(`Menu item ${index + 1} clicked:`, this.href);
      
      // Ensure the link is clickable
      this.style.cursor = 'pointer';
      this.style.pointerEvents = 'auto';
      
      // Let the default behavior (navigation) happen
      // Don't prevent default - let the browser handle the navigation
    });
    
    // Ensure the link is clickable on hover
    item.addEventListener('mouseenter', function() {
      this.style.cursor = 'pointer';
      this.style.pointerEvents = 'auto';
    });
    
    // Add visual feedback
    item.addEventListener('mousedown', function() {
      this.style.transform = 'translateY(-2px) scale(0.98)';
    });
    
    item.addEventListener('mouseup', function() {
      this.style.transform = 'translateY(-4px) scale(1)';
    });
    
    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
  
  console.log('Circular menu items initialized successfully');
});