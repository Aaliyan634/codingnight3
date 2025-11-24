    const form = document.getElementById('signupForm');

    form.addEventListener('submit', function(e){
      e.preventDefault();

      let name = document.getElementById('name').value.trim();
      let email = document.getElementById('email').value.trim().toLowerCase();
      let pass = document.getElementById('password').value;

      if(!name || !email || !pass){
        alert("Please fill all fields");
        return;
      }

      let users = JSON.parse(localStorage.getItem("users") || "[]");

      let exists = users.find(u => u.email === email);
      if(exists){
        alert("This email already exists");
        return;
      }

      users.push({ id: Date.now(), name, email, pass });
      localStorage.setItem("users", JSON.stringify(users));

      alert("Account created");
      location.href = "signin.html";
    });
    // feed.js
// Beginner friendly JavaScript for the simple feed HTML you have.
// Features:
// - Direct image upload (saved as base64 in localStorage)
// - Like, Delete
// - Comments (add and show)
// - Share (navigator.share or copy fallback)
// - Simple localStorage persistence

// localStorage key
let POSTS_KEY = 'msa_posts_simple';

// Elements (IDs/classes must match the HTML template you used)
let themeBtn = document.getElementById('themeBtn');
let postText = document.getElementById('postText');
let postImage = document.getElementById('postImage');
let addPostBtn = document.getElementById('addPostBtn');
let feed = document.getElementById('feed');
let postTemplate = document.getElementById('postTemplate');

// Simple "user" name (since no auth in minimal HTML)
let currentUser = 'Me';

// Helper: load/save posts
function loadPosts() {
  let raw = localStorage.getItem(POSTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}
function savePosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

// Helper: convert File -> base64 data URL
function fileToBase64(file, cb) {
  let reader = new FileReader();
  reader.onload = function() {
    cb(null, reader.result);
  };
  reader.onerror = function() {
    cb('Error reading file');
  };
  reader.readAsDataURL(file);
}

// Create a post object and persist
function createPost(text, imageDataUrl) {
  let posts = loadPosts();
  let post = {
    id: Date.now(),        // simple id
    user: currentUser,
    text: text || '',
    image: imageDataUrl || '', // base64 or empty
    createdAt: Date.now(),
    likes: 0,
    likedBy: [],
    comments: []          // { user, text, createdAt }
  };
  posts.unshift(post); // newest first
  savePosts(posts);
  return post;
}

// Remove post by id
function removePost(id) {
  let posts = loadPosts();
  posts = posts.filter(p => p.id !== id);
  savePosts(posts);
  render();
}

// Toggle like by currentUser
function toggleLike(id) {
  let posts = loadPosts();
  for (let i = 0; i < posts.length; i++) {
    if (posts[i].id === id) {
      let p = posts[i];
      if (p.likedBy && p.likedBy.indexOf(currentUser) !== -1) {
        // unlike
        p.likedBy = p.likedBy.filter(u => u !== currentUser);
      } else {
        p.likedBy = p.likedBy || [];
        p.likedBy.push(currentUser);
      }
      p.likes = p.likedBy.length;
      break;
    }
  }
  savePosts(posts);
  render();
}

// Add comment
function addComment(postId, commentText) {
  if (!commentText || !commentText.trim()) return;
  let posts = loadPosts();
  for (let i = 0; i < posts.length; i++) {
    if (posts[i].id === postId) {
      posts[i].comments = posts[i].comments || [];
      posts[i].comments.push({
        user: currentUser,
        text: commentText.trim(),
        createdAt: Date.now()
      });
      break;
    }
  }
  savePosts(posts);
  render();
}

// Share post (simple) - use Web Share API if available else copy to clipboard
function sharePost(post) {
  let shareText = post.text || '';
  let title = post.user + ' on Mini Social';
  if (navigator.share) {
    try {
      // We share text + url (image may be too big, so we share text and current page)
      navigator.share({
        title: title,
        text: shareText,
        url: location.href
      }).catch(()=>{}); // ignore errors
    } catch (e) {
      // ignore
    }
  } else {
    // fallback: copy text to clipboard
    let toCopy = title + '\n\n' + shareText;
    if (post.image) {
      toCopy += '\n\n[Image attached in app]';
    }
    // try navigator.clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(toCopy).then(function(){
        alert('Post text copied to clipboard. You can paste it to share.');
      }, function(){
        fallbackCopy(toCopy);
      });
    } else {
      fallbackCopy(toCopy);
    }
  }
}
function fallbackCopy(text) {
  // older fallback
  let ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    alert('Post text copied to clipboard.');
  } catch (e) {
    alert('Copy failed. You can manually select and copy the post text.');
  }
  document.body.removeChild(ta);
}

// Render the feed
function render() {
  let posts = loadPosts();
  feed.innerHTML = '';
  if (!posts || posts.length === 0) {
    feed.innerHTML = '<p>No posts yet. Create one!</p>';
    return;
  }

  for (let i = 0; i < posts.length; i++) {
    let p = posts[i];

    // use template
    let tpl = postTemplate.content.cloneNode(true);
    let postEl = tpl.querySelector('.post');

    // fill text
    let textEl = tpl.querySelector('.postText');
    if (textEl) textEl.textContent = p.text;

    // image
    let imgEl = tpl.querySelector('.postImg');
    if (imgEl) {
      if (p.image) {
        imgEl.src = p.image;
        imgEl.style.display = 'block';
      } else {
        imgEl.style.display = 'none';
      }
    }

    // share button
    let shareBtn = tpl.querySelector('.shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', function() {
        sharePost(p);
      });
    }

    // comments container
    let commentsEl = tpl.querySelector('.comments');
    if (commentsEl) {
      commentsEl.innerHTML = ''; // fill comments
      if (p.comments && p.comments.length > 0) {
        for (let j = 0; j < p.comments.length; j++) {
          let c = p.comments[j];
          let cdiv = document.createElement('div');
          cdiv.style.marginBottom = '6px';
          cdiv.style.fontSize = '14px';
          cdiv.textContent = c.user + ': ' + c.text;
          commentsEl.appendChild(cdiv);
        }
      } else {
        commentsEl.innerHTML = '<div style="color:gray;font-size:13px">No comments</div>';
      }
    }

    // comment add button
    let addCommentBtn = tpl.querySelector('.addCommentBtn');
    let commentInput = tpl.querySelector('.commentInput');
    if (addCommentBtn && commentInput) {
      addCommentBtn.addEventListener('click', function() {
        let val = commentInput.value;
        if (!val || !val.trim()) {
          alert('Comment likho.');
          return;
        }
        addComment(p.id, val);
      });
    }

    // Like button (we'll create a simple like button UI)
    // We don't have a like element in the template, so let's create one
    let likeBtn = document.createElement('button');
    likeBtn.textContent = 'Like (' + (p.likes || 0) + ')';
    likeBtn.style.marginRight = '8px';
    likeBtn.addEventListener('click', function() {
      toggleLike(p.id);
    });

    // Delete button (only for "Me" / currentUser)
    let deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.style.marginLeft = '8px';
    deleteBtn.style.background = '#e74c3c';
    deleteBtn.style.color = 'white';
    deleteBtn.style.border = 'none';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.addEventListener('click', function() {
      if (confirm('Kya aap is post ko delete karna chahte hain?')) {
        removePost(p.id);
      }
    });

    // Put like/delete next to share (in template order it will appear)
    if (shareBtn) {
      shareBtn.parentNode.insertBefore(likeBtn, shareBtn.nextSibling);
      shareBtn.parentNode.insertBefore(deleteBtn, likeBtn.nextSibling);
    }

    // created at and user info
    let meta = document.createElement('div');
    meta.style.fontSize = '12px';
    meta.style.color = 'gray';
    let d = new Date(p.createdAt);
    meta.textContent = p.user + ' • ' + d.toLocaleString();
    postEl.insertBefore(meta, postEl.firstChild);

    // finally append post element
    feed.appendChild(postEl);
  }
}

// Handle add post click
addPostBtn.addEventListener('click', function() {
  let text = postText.value || '';
  // if there is a file, read it
  if (postImage.files && postImage.files.length > 0) {
    let f = postImage.files[0];
    fileToBase64(f, function(err, dataUrl) {
      if (err) {
        alert('Image read error');
        return;
      }
      createPost(text, dataUrl);
      postText.value = '';
      postImage.value = '';
      render();
    });
  } else {
    createPost(text, '');
    postText.value = '';
    postImage.value = '';
    render();
  }
});

// Theme toggle (simple)
if (themeBtn) {
  themeBtn.addEventListener('click', function() {
    // toggle a class on body
    if (document.body.classList.contains('light')) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  });
}

// init render on page load
render();

    