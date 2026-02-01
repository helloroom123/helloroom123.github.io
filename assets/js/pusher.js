// Pusher Client for Frontend
// Import this in your HTML pages using <script src="https://js.pusher.com/8.2.0/pusher.min.js"></script> first

const PUSHER_KEY = '2c6a6d2d91a43714d013';
const PUSHER_CLUSTER = 'mt1';

let pusherInstance = null;

export function initPusher() {
    if (pusherInstance) return pusherInstance;

    // Enable logging for debugging
    // Pusher.logToConsole = true;

    pusherInstance = new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        encrypted: true
    });

    return pusherInstance;
}

// Example usage:
/*
import { initPusher } from './assets/js/pusher.js';
const pusher = initPusher();
const channel = pusher.subscribe('my-channel');
channel.bind('my-event', function(data) {
  alert(JSON.stringify(data));
});
*/
