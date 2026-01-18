/**
 * Fetch with Retry - Utility pentru request-uri HTTP cu retry logic
 * 
 * Această funcție încearcă de mai multe ori un request HTTP
 * cu exponential backoff (întârziere crescătoare între încercări).
 * 
 * @param {string} url - URL-ul de accesat
 * @param {Object} options - Opțiuni pentru fetch (method, headers, body, etc.)
 * @param {number} retries - Numărul de încercări (default: 3)
 * @param {number} delay - Întârzierea inițială în ms (default: 500)
 * @returns {Promise<Response>} - Response-ul fetch
 */
export async function fetchWithRetry(url, options = {}, retries = 3, delay = 500) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            // Timeout de 5 secunde per request
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            return response;
        } catch (error) {
            const isLastAttempt = attempt === retries - 1;

            if (isLastAttempt) {
                console.error(`[fetchWithRetry] Failed after ${retries} attempts:`, error.message);
                throw error;
            }

            // Exponential backoff: 500ms, 1000ms, 2000ms...
            const waitTime = delay * Math.pow(2, attempt);
            console.log(`[fetchWithRetry] Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

/**
 * Wrapper pentru GET request cu retry
 */
export async function fetchGetWithRetry(url) {
    const timestamp = Date.now();
    const urlWithTimestamp = url.includes('?')
        ? `${url}&t=${timestamp}`
        : `${url}?t=${timestamp}`;

    const response = await fetchWithRetry(urlWithTimestamp);
    return response.json();
}

/**
 * Wrapper pentru POST request cu retry
 */
export async function fetchPostWithRetry(url, data) {
    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Wrapper pentru PUT request cu retry
 */
export async function fetchPutWithRetry(url, data) {
    const response = await fetchWithRetry(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}

/**
 * Wrapper pentru DELETE request cu retry
 */
export async function fetchDeleteWithRetry(url, confirmDelete = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (confirmDelete) {
        headers['X-Confirm-Delete'] = 'true';
    }

    const response = await fetchWithRetry(url, {
        method: 'DELETE',
        headers
    });
    return response.json();
}
