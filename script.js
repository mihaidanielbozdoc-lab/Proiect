// List of common cat coat colors and patterns to match against Cataas API tags
const COLOR_TAGS = [
  'black', 'white', 'orange', 'red', 'grey', 'gray', 'brown', 
  'calico', 'tortoiseshell', 'tabby', 'ginger', 'siamese'
];

document.addEventListener('DOMContentLoaded', initApp);
document.getElementById('factForm').addEventListener('submit', fetchCatContent);

// Initialize app: Load tags from Cataas API on page startup
async function initApp() {
  await populateColorDropdown();
}

async function populateColorDropdown() {
  const select = document.getElementById('colorSelect');

  try {
    const response = await fetch('https://cataas.com/api/tags');
    if (!response.ok) throw new Error('Failed to fetch tags');

    const allTags = await response.json();

    // Filter API tags against our color/pattern list
    const availableColors = allTags.filter(tag => 
      COLOR_TAGS.includes(tag.toLowerCase())
    );

    // Populate dropdown options dynamically
    availableColors.forEach(color => {
      const option = document.createElement('option');
      option.value = color.toLowerCase();
      option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      select.appendChild(option);
    });

  } catch (error) {
    console.warn('Could not load dynamic tags from Cataas, loading fallback colors:', error);
    // Fallback list if API tag endpoint is unreachable
    COLOR_TAGS.slice(0, 6).forEach(color => {
      const option = document.createElement('option');
      option.value = color;
      option.textContent = color.charAt(0).toUpperCase() + color.slice(1);
      select.appendChild(option);
    });
  }
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('Failed to load image from Cataas'));
  });
}

const minimumDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCatContent(event) {
  event.preventDefault();

  const userTag = document.getElementById('tagInput').value.trim().toLowerCase();
  const selectedColor = document.getElementById('colorSelect').value;
  const maxLength = document.getElementById('maxLength').value.trim();

  const initialText = document.getElementById('initialText');
  const statusDiv = document.getElementById('status');
  const factText = document.getElementById('factText');
  const catImage = document.getElementById('catImage');
  const spinner = document.getElementById('spinner');
  const submitBtn = document.getElementById('getCatBtn');

  // Hide initial instruction text
  if (initialText && !initialText.classList.contains('hidden')) {
    initialText.classList.add('hidden');
  }

  // Set loading state
  spinner.classList.remove('hidden');
  catImage.classList.add('hidden');
  submitBtn.disabled = true;
  statusDiv.textContent = 'Filtering cat content...';

  // 1. Construct Cat Fact URL
  let factUrl = 'https://catfact.ninja/fact';
  if (maxLength) {
    factUrl += `?max_length=${encodeURIComponent(maxLength)}`;
  }

  // 2. Construct Cataas Image URL prioritizing specific user tag or API color option
  const activeTag = userTag || selectedColor;
  let imageUrl = 'https://cataas.com/cat';

  if (activeTag) {
    imageUrl += `/${encodeURIComponent(activeTag)}`;
  }
  
  // Append timestamp cache breaker
  imageUrl += `?t=${Date.now()}`;

  try {
    const [factResponse] = await Promise.all([
      fetch(factUrl),
      preloadImage(imageUrl),
      minimumDelay(1000) // Guarantees 1-second spinner animation
    ]);

    if (!factResponse.ok) throw new Error('Failed to fetch fact');

    const data = await factResponse.json();

    // 3. Update DOM with results
    catImage.src = imageUrl;
    catImage.classList.remove('hidden');
    factText.textContent = `"${data.fact}"`;
    statusDiv.textContent = '';

  } catch (error) {
    statusDiv.textContent = 'No cat image found for that selection. Try another option!';
    statusDiv.style.color = 'red';
    console.error('API Error:', error);
  } finally {
    spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}