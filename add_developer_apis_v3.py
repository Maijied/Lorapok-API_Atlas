import json

new_folders = [
    {
        "name": "Developer Productivity & Tools",
        "item": [
            {
                "name": "JSONPlaceholder",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://jsonplaceholder.typicode.com/posts",
                        "protocol": "https",
                        "host": ["jsonplaceholder", "typicode", "com"],
                        "path": ["posts"]
                    },
                    "description": "Fake REST API for testing and prototyping. Provides posts, comments, users, etc."
                },
                "response": []
            },
            {
                "name": "HTTPBin Echo",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://httpbin.org/get",
                        "protocol": "https",
                        "host": ["httpbin", "org"],
                        "path": ["get"]
                    },
                    "description": "HTTP request inspection, testing, and simulation utility."
                },
                "response": []
            },
            {
                "name": "Base64 Encoder/Decoder",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l",
                        "protocol": "https",
                        "host": ["httpbin", "org"],
                        "path": ["base64", "SFRUUEJJTiBpcyBhd2Vzb21l"]
                    },
                    "description": "Online tool for encoding and decoding Base64 strings."
                },
                "response": []
            },
            {
                "name": "QR Code Generator",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Lorapok",
                        "protocol": "https",
                        "host": ["api", "qrserver", "com"],
                        "path": ["v1", "create-qr-code", ""],
                        "query": [
                            {"key": "size", "value": "150x150"},
                            {"key": "data", "value": "Lorapok"}
                        ]
                    },
                    "description": "Generate QR codes on the fly."
                },
                "response": []
            },
            {
                "name": "UUID Generator",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://httpbin.org/uuid",
                        "protocol": "https",
                        "host": ["httpbin", "org"],
                        "path": ["uuid"]
                    },
                    "description": "Generates a unique UUID (Universally Unique Identifier)."
                },
                "response": []
            }
        ]
    },
    {
        "name": "Mock Data Generation",
        "item": [
            {
                "name": "Mockaroo (Realistic Data)",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://api.mockaroo.com/api/1000",
                        "protocol": "https",
                        "host": ["api", "mockaroo", "com"],
                        "path": ["api", "1000"]
                    },
                    "description": "Generate large, realistic datasets (CSV, JSON, SQL) based on custom schemas."
                },
                "response": []
            },
            {
                "name": "Random User API",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://randomuser.me/api/?results=5",
                        "protocol": "https",
                        "host": ["randomuser", "me"],
                        "path": ["api"],
                        "query": [{"key": "results", "value": "5"}]
                    },
                    "description": "Generates realistic user profiles with names, addresses, and photos."
                },
                "response": []
            }
        ]
    },
    {
        "name": "Package Registries",
        "item": [
            {
                "name": "NPM Package Metadata",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://registry.npmjs.org/axios",
                        "protocol": "https",
                        "host": ["registry", "npmjs", "org"],
                        "path": ["axios"]
                    },
                    "description": "Full metadata for any NPM package including versions and dependencies."
                },
                "response": []
            },
            {
                "name": "PyPI Project Info",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://pypi.org/pypi/requests/json",
                        "protocol": "https",
                        "host": ["pypi", "org"],
                        "path": ["pypi", "requests", "json"]
                    },
                    "description": "JSON metadata for Python packages on PyPI."
                },
                "response": []
            },
            {
                "name": "Crates.io Rust Metadata",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://crates.io/api/v1/crates/serde",
                        "protocol": "https",
                        "host": ["crates", "io"],
                        "path": ["api", "v1", "crates", "serde"]
                    },
                    "description": "Detailed information about Rust crates."
                },
                "response": []
            }
        ]
    },
    {
        "name": "Icons & Design Assets",
        "item": [
            {
                "name": "Lucide Icons Search",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://lucide.dev/api/icons?search=user",
                        "protocol": "https",
                        "host": ["lucide", "dev"],
                        "path": ["api", "icons"],
                        "query": [{"key": "search", "value": "user"}]
                    },
                    "description": "Search and retrieve SVG metadata for Lucide icons."
                },
                "response": []
            },
            {
                "name": "Google Fonts API",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://www.googleapis.com/webfonts/v1/webfonts?key=YOUR_API_KEY",
                        "protocol": "https",
                        "host": ["www", "googleapis", "com"],
                        "path": ["webfonts", "v1", "webfonts"],
                        "query": [{"key": "key", "value": "YOUR_API_KEY"}]
                    },
                    "description": "Comprehensive list of all available Google Fonts."
                },
                "response": []
            }
        ]
    },
    {
        "name": "Code & Repository Tools",
        "item": [
            {
                "name": "GitHub Repo Details",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://api.github.com/repos/facebook/react",
                        "protocol": "https",
                        "host": ["api", "github", "com"],
                        "path": ["repos", "facebook", "react"]
                    },
                    "description": "Fetch stars, forks, and metadata for any public GitHub repository."
                },
                "response": []
            },
            {
                "name": "GitLab Project Search",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://gitlab.com/api/v4/projects?search=atlas",
                        "protocol": "https",
                        "host": ["gitlab", "com"],
                        "path": ["api", "v4", "projects"],
                        "query": [{"key": "search", "value": "atlas"}]
                    },
                    "description": "Search for public projects on GitLab."
                },
                "response": []
            }
        ]
    },
    {
        "name": "Infra & Status Monitoring",
        "item": [
            {
                "name": "API Status Check",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://apistatuscheck.com/api/v1/status/github",
                        "protocol": "https",
                        "host": ["apistatuscheck", "com"],
                        "path": ["api", "v1", "status", "github"]
                    },
                    "description": "Check the real-time status of major dev dependencies like GitHub, Stripe, etc."
                },
                "response": []
            },
            {
                "name": "Instatus Pages",
                "request": {
                    "method": "GET",
                    "header": [],
                    "url": {
                        "raw": "https://api.instatus.com/v1/pages",
                        "protocol": "https",
                        "host": ["api", "instatus", "com"],
                        "path": ["v1", "pages"]
                    },
                    "description": "Retrieve status page information from Instatus. (Requires Key)"
                },
                "response": []
            }
        ]
    }
]

file_path = 'lorapok-api-atlas/src/data/api_collection.json'
with open(file_path, 'r') as f:
    data = json.load(f)

# Add new folders after existing core categories like 'AI & Modern APIs' (index 0)
# and before 'Reference & Religion' (which is usually later in the original list)
# Inserting at index 1 places it after 'AI & Modern APIs'
for folder in reversed(new_folders):
    data['item'].insert(1, folder)

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print(f"Successfully added {len(new_folders)} developer-focused categories to {file_path}")
