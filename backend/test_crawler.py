#!/usr/bin/env python3
"""
ไฟล์ทดสอบ API Crawler
"""

import requests
import json
from pprint import pprint

# กำหนด URL ของ API
BASE_URL = "http://10.114.139.140:8000/v1/crawler"


def test_search_api():
    """
    ทดสอบ API search
    """
    print("🔍 Testing Search API...")

    # ทดสอบค้นหาคำที่อาจจะเจอเว็บพนัน
    test_queries = ["บาคาร่า", "แทงหวย", "casino online", "เว็บพนัน"]

    for query in test_queries:
        print(f"\n📋 Testing query: {query}")

        try:
            response = requests.get(f"{BASE_URL}/search", params={"query": query})

            if response.status_code == 200:
                results = response.json()
                print(f"✅ Success! Found {len(results)} results")

                suspicious_sites = [r for r in results if r.get("is_suspicious")]
                print(f"⚠️ Suspicious sites found: {len(suspicious_sites)}")

                for site in suspicious_sites:
                    print(f"  - {site['title']}")
                    print(f"    URL: {site['link']}")
                    if site.get("screenshot_url"):
                        print(f"    Screenshot: {site['screenshot_url']}")
                    print()

            else:
                print(f"❌ Error: {response.status_code}")
                print(response.text)

        except Exception as e:
            print(f"❌ Exception: {e}")


def test_screenshot_api():
    """
    ทดสอบ API screenshot
    """
    print("\n📸 Testing Screenshot API...")

    test_url = "https://www.google.com"

    try:
        response = requests.post(
            f"{BASE_URL}/screenshot", params={"url": test_url, "title": "Google Search"}
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Screenshot API success!")
            print(f"Screenshot URL: {result.get('screenshot_url')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Exception: {e}")


if __name__ == "__main__":
    print("🚀 Starting API Tests...")

    # ทดสอบ search API
    test_search_api()

    # ทดสอบ screenshot API
    test_screenshot_api()

    print("\n✅ Tests completed!")
