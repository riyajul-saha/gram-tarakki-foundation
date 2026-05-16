from PIL import Image, ImageDraw, ImageFont
import qrcode
import textwrap


def generate_dynamic_certificate(data):
    # 1. Base Image Open
    base_img_path = "Base_Certificate.jpg"
    img = Image.open(base_img_path)
    draw = ImageDraw.Draw(img)
    img_width, img_height = img.size

    # ডাইনামিক স্কেলিং: ইমেজের হাইটের ওপর ভিত্তি করে ফন্ট সাইজ বড় হবে
    # (আগের চেয়ে এই স্কেল ভ্যালুগুলো অনেকগুণ বাড়ানো হয়েছে)
    scale = img_height / 1000 

    size_title = int(85 * scale) # আগের চেয়ে অনেক বড়
    size_id = int(38 * scale)    # আগের চেয়ে বড়
    size_name = int(105 * scale)  # সবচেয়ে বড়, স্টুডেন্টের নাম
    size_body = int(20 * scale)  # মূল বডি টেক্সট
    size_link = int(28 * scale)  # ভেরিফিকেশন লিঙ্ক

    # 2. Font Load (ফাইলের নামগুলো তোমার ফোল্ডারের সাথে মিলিয়ে নেবে)
    # তোমার কাছে Kelvich OTF ফাইল আছে, তাই আমি Kelvinch.otf নাম ব্যবহার করছি
    font_cert_type = ImageFont.truetype("GildaDisplay-Regular.ttf", size_title)
    font_id = ImageFont.truetype("GildaDisplay-Regular.ttf", size_id)
    font_name = ImageFont.truetype("SlopeScript.ttf", size_name)
    font_body = ImageFont.truetype("Kelvinch-Regular.otf", size_body) # OTF ফাইল ব্যবহার করা হলো
    font_link = ImageFont.truetype("GildaDisplay-Regular.ttf", size_link)

    # 3. ID বসানো (সেন্টারে, ইমেজের উপরের দিকে)
    id_text = f"ID: {data['cert_id']}"
    bbox_id = draw.textbbox((0, 0), id_text, font=font_id)
    x_id = (img_width - (bbox_id[2] - bbox_id[0])) / 2
    y_id = img_height * 0.13 # উপর থেকে ১০% নিচে
    draw.text((x_id, y_id), id_text, font=font_id, fill="#000000")

    # 4. Certificate Type
    cert_type_text = f"Certificate of {data['cert_type']}"
    bbox_type = draw.textbbox((0, 0), cert_type_text, font=font_cert_type)
    x_type = (img_width - (bbox_type[2] - bbox_type[0])) / 2
    y_type = img_height * 0.19 # উপর থেকে ১৮% নিচে (বড় ফন্টের জন্য এই অবস্থান ঠিক আছে)
    draw.text((x_type, y_type), cert_type_text, font=font_cert_type, fill="#343434")

    # 5. Student Name (ঠিক মাঝখানে, ডটেড লাইনের ওপরে)
    bbox_name = draw.textbbox((0, 0), data['student_name'], font=font_name)
    x_name = (img_width - (bbox_name[2] - bbox_name[0])) / 2
    y_name = img_height * 0.40 # উপর থেকে ৪০% নিচে (আরও নিচে নামাতে চাইলে এই ভ্যালু বাড়াও)
    draw.text((x_name, y_name), data['student_name'], font=font_name, fill="#485155")

    # 6. Body Description
    body_text = f"This is to certify that {data['student_name']} has successfully completed the internship/training program at GRAM TARAKKI FOUNDATION from {data['start_date']} to {data['end_date']}. During this period, they demonstrated sincerity, dedication, and valuable contribution toward their assigned responsibilities. We appreciate their efforts and wish them continued success in their future endeavors."
    # বড় ফন্টের জন্য লাইন আরও তাড়াতাড়ি ভাঙতে হবে, তাই width কমানো হলো
    wrapped_text = textwrap.fill(body_text, width=90) # 80 থেকে কমিয়ে 70 করা হলো
    
    bbox_body = draw.multiline_textbbox((0,0), wrapped_text, font=font_body, align="center")
    x_body = (img_width - (bbox_body[2] - bbox_body[0])) / 2
    y_body = img_height * 0.54 # উপর থেকে ৫৮% নিচে (বড় নামের জন্য একটু নিচে নামানো হলো)
    draw.multiline_text((x_body, y_body), wrapped_text, font=font_body, fill="#2e6417", align="center", spacing=15)

    # 7. Verification Link (এটি আগের ছবিতে একদম নিচে ডটেড লাইনের ওপরে ছিল, তাই সেভাবেই রাখা হলো)
    link_text = f"To Verify Certificate Visit: {data['verify_link']}"
    bbox_link = draw.textbbox((0, 0), link_text, font=font_link)
    x_link = (img_width - (bbox_link[2] - bbox_link[0])) / 2
    # আগের ইমেজে এটি ডটেড লাইনের একদম ওপরে ছিল, আমরা ৯২% এ সেট করছি যাতে ওভারল্যাপ না হয়
    y_link = img_height * 0.94 
    # ফন্ট কালার নীল (Blue) করে লিঙ্ক হিসেবে চিহ্নিত করা হলো
    draw.text((x_link, y_link), link_text, font=font_link, fill="#0000EE")

   # 8. QR Code with Logo (Transparent & Branded)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction লোগোর জন্য জরুরি
        box_size=10,
        border=4,
    )
    qr.add_data(data['verify_link'])
    qr.make(fit=True)

    # QR কোডটিকে ইমেজে কনভার্ট করা (কালো রং এবং সাদা ব্যাকগ্রাউন্ড)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
    
    # পিক্সেল প্রসেসিং করে ব্যাকগ্রাউন্ড ট্রান্সপারেন্ট করা (আগের লজিক)
    pixels = qr_img.load()
    for y in range(qr_img.height):
        for x in range(qr_img.width):
            if pixels[x, y][:3] == (255, 255, 255):
                pixels[x, y] = (255, 255, 255, 0)

    # --- মাঝখানে লোগো বসানোর অংশ ---
    try:
        logo = Image.open("logo.png").convert("RGBA") # তোমার লোগো ফাইল
        
        # লোগোর সাইজ ক্যালকুলেট করা (QR কোডের প্রায় ২৫% সাইজ হবে)
        qr_width, qr_height = qr_img.size
        logo_size = int(qr_width * 0.25) 
        logo = logo.resize((logo_size, logo_size))
        
        # লোগোটিকে একদম মাঝখানে বসানোর পজিশন বের করা
        logo_pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)
        
        # QR কোডের ওপর লোগোটি পেস্ট করা
        qr_img.paste(logo, logo_pos, mask=logo)
    except FileNotFoundError:
        print("Logo not found! Generating QR without logo.")

    # ফাইনাল QR কোডটিকে সার্টিফিকেটের সাইজ অনুযায়ী রিসাইজ করা
    final_qr_size = int(img_height * 0.12)
    qr_img = qr_img.resize((final_qr_size, final_qr_size))

    # সার্টিফিকেটের একদম মাঝখানে (সেন্টারে) বসানো
    # X পজিশন হবে মাঝখানে, Y পজিশন বডি টেক্সটের নিচে
    qr_x = int(img_width * 0.20)
    qr_y = int(img_height * 0.28) # সিগনেচারের ঠিক ওপরে এবং টেক্সটের নিচে
    
    img.paste(qr_img, (qr_x, qr_y), mask=qr_img)

    # 9. Signatures Attach
    try:
        # সিগনেচার সাইজও একটু বাড়ানো হলো যাতে বড় ডিজাইনটার সাথে খাপ খায়
        sig_width = int(img_width * 0.18) # ১৫% থেকে বাড়িয়ে ১৮%
        sig_height = int(img_height * 0.10) # ৮% থেকে বাড়িয়ে ১০%
        
        # Head Signature (বাম দিকে লাইনের ওপরে)
        head_sig = Image.open("head_signature.png").convert("RGBA")
        head_sig = head_sig.resize((sig_width, sig_height))
        # সিগনেচারের Y অবস্থান ঠিক আছে, কারণ ডটেড লাইন একই জায়গায় আছে
        img.paste(head_sig, (int(img_width * 0.15), int(img_height * 0.72)), mask=head_sig)

        # Mentor Signature (ডান দিকে লাইনের ওপরে)
        mentor_sig = Image.open("mentor_signature.png").convert("RGBA")
        mentor_sig = mentor_sig.resize((sig_width, sig_height))
        img.paste(mentor_sig, (int(img_width * 0.65), int(img_height * 0.72)), mask=mentor_sig)
    except FileNotFoundError:
        print("Signature images not found. Skipping signatures.")

    # 10. Final Image Save
    output_filename = f"Certificate_{data['cert_id']}.jpg"
    # সেভ করার সময় কোয়ালিটি ১০০ করে দেওয়া হলো যাতে লেখাগুলো নিখুঁত দেখায়
    img.convert('RGB').save(output_filename, quality=100)
    print(f"Certificate saved successfully as {output_filename}")

# --- Test Data ---
student_data = {
    "cert_id": "GTFIN26001",
    "cert_type": "Experience",
    "student_name": "Ariana Gantait",
    "start_date": "2/01/2026",
    "end_date": "26/05/2026",
    "verify_link": "www.gtfoundation.in/certificate/GTFIN26001"
}

# এই ফাংশনটি নতুন আপডেটেড কোড দিয়ে সার্টিফিকেট তৈরি করবে
generate_dynamic_certificate(student_data)