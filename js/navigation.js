// Navigation handler for homepage menu items
document.addEventListener('DOMContentLoaded', function() {
    // Get all menu items
    const menuItems = document.querySelectorAll('.menu-item');
    
    // Check if user is logged in
    function isUserLoggedIn() {
        try {
            const userInfo = localStorage.getItem('user_info');
            return userInfo && JSON.parse(userInfo);
        } catch (error) {
            return false;
        }
    }
    
    // Define menu item destinations based on login status
    const getMenuDestinations = (isLoggedIn) => {
        if (isLoggedIn) {
            return {
                'Daerah Irigasi': 'dashboard.html',
                'Pemanfaatan SDA': 'map.html', 
                'Rawan Bencana': 'dashboard.html',
                'Infrastruktur SDA': 'map.html',
                'Pos STA Curah Hujan dan AWLR': 'dashboard.html',
                'Danau, Situ, dan Embung': 'map.html',
                'Saluran Pembuang/ Sungai': 'dashboard.html',
                'Garis Pantai': 'map.html'
            };
        } else {
            return {
                'Daerah Irigasi': 'login.html',
                'Pemanfaatan SDA': 'login.html', 
                'Rawan Bencana': 'login.html',
                'Infrastruktur SDA': 'login.html',
                'Pos STA Curah Hujan dan AWLR': 'login.html',
                'Danau, Situ, dan Embung': 'login.html',
                'Saluran Pembuang/ Sungai': 'login.html',
                'Garis Pantai': 'login.html'
            };
        }
    };
    
    // Add click handlers to each menu item
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Check login status
            const isLoggedIn = isUserLoggedIn();
            const destinations = getMenuDestinations(isLoggedIn);
            
            // Get the label text (remove <br> tags and normalize)
            const labelText = this.querySelector('.label').textContent
                .replace(/\s+/g, ' ')
                .trim();
            
            // Find matching destination
            let destination = 'login.html'; // default
            
            for (const [key, value] of Object.entries(destinations)) {
                if (labelText.includes(key.split(' ')[0])) { // Match first word
                    destination = value;
                    break;
                }
            }
            
            // Show loading state
            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';
            
            // Add loading animation
            const label = this.querySelector('.label');
            const originalText = label.textContent;
            label.textContent = 'Loading...';
            
            // Navigate after a short delay for visual feedback
            setTimeout(() => {
                window.location.href = destination;
            }, 300);
        });
    });
});