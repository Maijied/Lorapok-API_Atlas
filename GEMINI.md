## Workflow: Adding and Syncing New APIs

This document outlines the process for adding new APIs to the Lorapok API Atlas and synchronizing them with Postman and the website.

### 1. API Research & Preparation

-   **Discover APIs:** Utilize web searches (e.g., "free developer APIs github 2026", "open-source APIs for XYZ category") to find suitable APIs. Prioritize those with clear documentation, free tiers, and no strict API key requirements, or provide a clear demo key.
-   **Format API Data:** For each new API, prepare a JSON object conforming to the Postman Collection schema. This includes:
    -   `name`: The API's display name.
    -   `request`: Method (GET/POST etc.), URL (`raw`, `protocol`, `host`, `path`, `query`), and `description`.
    -   `authLink`: If the API requires an API key or registration, include a direct URL to the signup/developer page.
    -   `response`: (Optional) An example response or a placeholder.

### 2. Local Integration

-   **Update Local Collection:**
    -   Locate the `lorapok-api-atlas/src/data/api_collection.json` file.
    -   Add the new API JSON objects, ideally grouping them into logical categories (folders) within the `item` array. You can add new categories or append to existing ones.
    -   Ensure the JSON structure is valid.
-   **Update Repair Script (if needed):**
    -   If the new API has specific patterns or requires fixing (e.g., for better URL parsing, specific descriptions), update the `API_REPAIRS` dictionary in `lorapok-api-atlas/scripts/repair_and_validate.py`.
    -   If the new API requires an API key, add its registration URL to the `API_AUTH_LINKS` dictionary in the same script.
-   **Run Local Scripts:**
    -   Execute the repair script: `python3 lorapok-api-atlas/scripts/repair_and_validate.py`
    -   This script will update `lorapok-api-atlas/src/data/api_collection.json` with the new APIs and apply any defined repairs or auth links.

### 3. Postman Cloud Synchronization

-   **Download Current Collection:** Retrieve the latest collection from Postman Cloud to ensure you're not overwriting recent changes.
    ```bash
    curl -H "X-API-Key: <YOUR_POSTMAN_API_KEY>" https://api.getpostman.com/collections/<COLLECTION_UID> > Famous Free APIs.postman_collection.json
    ```
    Replace `<YOUR_POSTMAN_API_KEY>` and `<COLLECTION_UID>` with the correct values.
-   **Update Root Collection:** Copy the newly modified local `api_collection.json` to `Famous Free APIs.postman_collection.json` in the project root.
    ```bash
    cp lorapok-api-atlas/src/data/api_collection.json Famous Free APIs.postman_collection.json
    ```
-   **Sync with `curl`:** Use the `curl` command to PUT the updated collection back to Postman Cloud.
    ```bash
    # Prepare payload
    echo '{"collection":' > payload.json
    cat Famous Free APIs.postman_collection.json >> payload.json
    echo '}' >> payload.json

    # Send PUT request
    curl -X PUT -H "X-API-Key: <YOUR_POSTMAN_API_KEY>" -H "Content-Type: application/json" -d @payload.json https://api.getpostman.com/collections/<COLLECTION_UID>
    ```
    Replace placeholders as needed.

### 4. Website Update

-   **Automatic Deployment:** The project is configured for automated deployment to GitHub Pages via GitHub Actions.
-   **Trigger Deployment:** Commit and push your changes to the `main` branch.
    ```bash
    git add .
    git commit -m "feat: add new APIs and update documentation"
    git push origin main
    ```
-   **Verify:** Check the `GEMINI.md` file for the exact commit message format if it's part of an automated workflow. Once deployed, the new APIs will be visible on the website.