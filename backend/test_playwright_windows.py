#!/usr/bin/env python3
"""
Test script สำหรับตรวจสอบ Playwright บน Windows
เพื่อแก้ไขปัญหา NotImplementedError
"""

import asyncio
import platform
from playwright.async_api import async_playwright
from loguru import logger


async def test_playwright_windows():
    """
    ทดสอบ Playwright บน Windows พร้อมแก้ไขปัญหา event loop
    """
    logger.info(f"🔍 Testing Playwright on {platform.system()} {platform.release()}")

    # ปรับ event loop policy สำหรับ Windows
    if platform.system() == "Windows":
        try:
            # ใช้ ProactorEventLoop สำหรับ Windows
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
            logger.info("✅ Set Windows ProactorEventLoopPolicy")
        except Exception as e:
            logger.warning(f"⚠️ Could not set event loop policy: {e}")

    try:
        async with async_playwright() as p:
            logger.info("🚀 Launching Chromium browser...")

            # Browser args สำหรับ Windows
            browser_args = [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-extensions",
                "--disable-plugins",
                "--disable-web-security",
                "--ignore-certificate-errors",
            ]

            # สำหรับ Windows เพิ่ม args เพิ่มเติม
            if platform.system() == "Windows":
                browser_args.extend(
                    ["--disable-features=VizDisplayCompositor", "--single-process"]
                )

            browser = await p.chromium.launch(headless=True, args=browser_args)

            logger.info("✅ Browser launched successfully!")

            page = await browser.new_page()
            logger.info("✅ New page created!")

            # ทดสอบไปที่เว็บไซต์ง่ายๆ
            test_url = "https://www.google.com"
            logger.info(f"📡 Testing navigation to: {test_url}")

            await page.goto(test_url, timeout=10000)
            logger.info("✅ Navigation successful!")

            # ทดสอบ screenshot
            logger.info("📷 Testing screenshot...")
            screenshot_bytes = await page.screenshot(type="png")
            logger.info(f"✅ Screenshot taken! Size: {len(screenshot_bytes)} bytes")

            await browser.close()
            logger.info("🔒 Browser closed successfully!")

            return True

    except NotImplementedError as e:
        logger.error(f"❌ NotImplementedError: {e}")
        logger.error("💡 This suggests an issue with asyncio subprocess on Windows")
        return False
    except Exception as e:
        logger.error(f"❌ Error: {type(e).__name__}: {e}")
        return False


def run_test():
    """
    เรียกใช้ test ใน event loop ใหม่
    """
    # สร้าง event loop ใหม่สำหรับ Windows
    if platform.system() == "Windows":
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(test_playwright_windows())
        finally:
            loop.close()
    else:
        return asyncio.run(test_playwright_windows())


if __name__ == "__main__":
    logger.info("🧪 Starting Playwright Windows test...")
    success = run_test()

    if success:
        logger.info("🎉 Playwright test completed successfully!")
    else:
        logger.error("💥 Playwright test failed!")
        logger.info("💡 Possible solutions:")
        logger.info(
            "1. Install/reinstall Playwright browsers: poetry run python -m playwright install"
        )
        logger.info("2. Try running with different Python version")
        logger.info("3. Check Windows Subsystem for Linux (WSL) as alternative")
