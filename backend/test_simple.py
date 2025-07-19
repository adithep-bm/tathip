#!/usr/bin/env python3
"""
🔍 ไฟล์ทดสอบ Crawler API อย่างง่าย
รันคำสั่ง: python test_simple.py
"""

import requests
import json
import time

# ⚙️ การตั้งค่า
BASE_URL = "http://localhost:8000/v1/crawler"
TEST_QUERIES = [
    "บาคาร่า",  # คำที่น่าจะเจอเว็บพนัน
    "แทงหวย",  # คำที่น่าจะเจอเว็บพนัน
    "ข่าวกีฬา",  # คำปกติ
    "casino online",  # คำภาษาอังกฤษ
]


def test_search_simple():
    """ทดสอบ API search แบบง่าย"""
    print("🔍 กำลังทดสอบ Search API...")
    print("=" * 50)

    for query in TEST_QUERIES:
        print(f"\n📋 ค้นหา: '{query}'")

        try:
            # เรียก API
            response = requests.get(
                f"{BASE_URL}/search", params={"query": query}, timeout=30
            )

            if response.status_code == 200:
                results = response.json()
                print(f"✅ พบผลลัพธ์: {len(results)} รายการ")

                # หาเว็บต้องสงสัย
                suspicious = [r for r in results if r.get("is_suspicious", False)]
                print(f"⚠️  เว็บต้องสงสัย: {len(suspicious)} รายการ")

                # แสดงเว็บต้องสงสัย
                for i, site in enumerate(suspicious[:3]):  # แสดงแค่ 3 อันแรก
                    print(f"  {i+1}. {site['title'][:50]}...")
                    print(f"     URL: {site['link']}")
                    if site.get("screenshot_url"):
                        print(f"     📸 Screenshot: {site['screenshot_url']}")

            else:
                print(f"❌ Error {response.status_code}: {response.text}")

        except requests.exceptions.Timeout:
            print("⏰ Timeout - API ใช้เวลานานเกินไป")
        except requests.exceptions.ConnectionError:
            print("🔌 Connection Error - ตรวจสอบว่า server รันอยู่หรือไม่")
        except Exception as e:
            print(f"❌ Error: {e}")

        print("-" * 30)


def test_screenshot_simple():
    """ทดสอบ Screenshot API แบบง่าย"""
    print("\n📸 กำลังทดสอบ Screenshot API...")
    print("=" * 50)

    test_url = "https://www.google.com"

    try:
        print(f"📷 Screenshot: {test_url}")

        response = requests.post(
            f"{BASE_URL}/screenshot",
            params={"url": test_url, "title": "Google Homepage"},
            timeout=60,
        )  # Screenshot ใช้เวลานาน

        if response.status_code == 200:
            result = response.json()
            print("✅ Screenshot สำเร็จ!")
            print(f"📸 URL: {result.get('screenshot_url')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except requests.exceptions.Timeout:
        print("⏰ Timeout - Screenshot ใช้เวลานานเกินไป")
    except requests.exceptions.ConnectionError:
        print("🔌 Connection Error - ตรวจสอบว่า server รันอยู่หรือไม่")
    except Exception as e:
        print(f"❌ Error: {e}")


def check_server():
    """ตรวจสอบว่า server รันอยู่หรือไม่"""
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            print("✅ Server รันอยู่!")
            return True
        else:
            print("❌ Server ไม่ตอบสนอง")
            return False
    except:
        print("❌ ไม่สามารถเชื่อมต่อ server ได้")
        print("💡 รันคำสั่ง: poetry run fastapi dev backend/main.py --port 8000")
        return False


if __name__ == "__main__":
    print("🚀 เริ่มทดสอบ Crawler API")
    print("=" * 50)

    # ตรวจสอบ server ก่อน
    if not check_server():
        exit(1)

    # ทดสอบ Search API
    test_search_simple()

    # ทดสอบ Screenshot API
    test_screenshot_simple()

    print("\n🎉 การทดสอบเสร็จสิ้น!")
    print("\n📖 ดูคู่มือเพิ่มเติมได้ที่: CRAWLER_API_GUIDE.md")
