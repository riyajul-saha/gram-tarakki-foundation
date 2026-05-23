from PIL import Image, ImageDraw, ImageFont
import qrcode
import textwrap

import json
import os

def generate_dynamic_certificate(data, mentor_sig_path=None, head_sig_path=None):
    # Setup paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    data_dir = os.path.join(project_root, 'data', 'certificate_data')
    output_dir = os.path.join(project_root, 'certificate', 'intern')
    os.makedirs(output_dir, exist_ok=True)

    # Read certificate data from JSON
    json_path = os.path.join(data_dir, 'certificate_data.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        cert_info = json.load(f)
    
    intern_info = cert_info.get("Intern", {})
    data['cert_type'] = intern_info.get("cert_type", "Experience")
    
    body_template = intern_info.get("body", "This is to certify that {student_name} has successfully completed the internship/training program at GRAM TARAKKI FOUNDATION from {start_date} to {end_date}.")
    body_text = body_template.format(
        student_name=data.get('student_name', ''),
        start_date=data.get('start_date', ''),
        end_date=data.get('end_date', '')
    )

    # 1. Base Image Open
    base_img_path = os.path.join(data_dir, "Base_Certificate.jpg")
    img = Image.open(base_img_path)
    draw = ImageDraw.Draw(img)
    img_width, img_height = img.size

    # Dynamic scaling: Font size will increase based on the image height
    # (These scale values have been increased significantly compared to before)
    scale = img_height / 1000 

    size_title = int(85 * scale) # Much larger than before
    size_id = int(38 * scale)    # Larger than before
    size_name = int(105 * scale)  # Largest, student's name
    size_body = int(20 * scale)  # Main body text
    size_link = int(28 * scale)  # Verification link

    # 2. Font Load (Match file names with your folder)
    # You have Kelvinch OTF file, so I'm using Kelvinch.otf name
    font_cert_type = ImageFont.truetype(os.path.join(data_dir, "GildaDisplay-Regular.ttf"), size_title)
    font_id = ImageFont.truetype(os.path.join(data_dir, "GildaDisplay-Regular.ttf"), size_id)
    font_name = ImageFont.truetype(os.path.join(data_dir, "SlopeScript.ttf"), size_name)
    font_body = ImageFont.truetype(os.path.join(data_dir, "Kelvinch-Regular.otf"), size_body) # OTF file used
    font_link = ImageFont.truetype(os.path.join(data_dir, "GildaDisplay-Regular.ttf"), size_link)

    # 3. ID Placement (Centered, at the top of the image)
    id_text = f"ID: {data['cert_id']}"
    bbox_id = draw.textbbox((0, 0), id_text, font=font_id)
    x_id = (img_width - (bbox_id[2] - bbox_id[0])) / 2
    y_id = img_height * 0.13 # 13% from the top
    draw.text((x_id, y_id), id_text, font=font_id, fill="#000000")

    # 4. Certificate Type
    cert_type_text = f"Certificate of {data['cert_type']}"
    bbox_type = draw.textbbox((0, 0), cert_type_text, font=font_cert_type)
    x_type = (img_width - (bbox_type[2] - bbox_type[0])) / 2
    y_type = img_height * 0.19 # 19% from top (this position is fine for large fonts)
    draw.text((x_type, y_type), cert_type_text, font=font_cert_type, fill="#343434")

    # 5. Student Name (Centered, above the dotted line)
    bbox_name = draw.textbbox((0, 0), data['student_name'], font=font_name)
    x_name = (img_width - (bbox_name[2] - bbox_name[0])) / 2
    y_name = img_height * 0.40 # 40% from top (increase this value if you want to lower it further)
    draw.text((x_name, y_name), data['student_name'], font=font_name, fill="#485155")

    # 6. Body Description
    # body_text is already formatted above
    # For larger fonts, lines need to break sooner, so width is reduced
    wrapped_text = textwrap.fill(body_text, width=90) 
    
    bbox_body = draw.multiline_textbbox((0,0), wrapped_text, font=font_body, align="center")
    x_body = (img_width - (bbox_body[2] - bbox_body[0])) / 2
    y_body = img_height * 0.54 # 54% from top (lowered slightly for large names)
    draw.multiline_text((x_body, y_body), wrapped_text, font=font_body, fill="#2e6417", align="center", spacing=15)

    # 7. Verification Link (This was above the dotted line at the bottom in the previous image, so kept it that way)
    link_text = f"To Verify Certificate Visit: {data['verify_link']}"
    bbox_link = draw.textbbox((0, 0), link_text, font=font_link)
    x_link = (img_width - (bbox_link[2] - bbox_link[0])) / 2
    # In the previous image it was right above the dotted line, we set it at 94% to avoid overlap
    y_link = img_height * 0.94 
    # Font color set to blue to identify as a link
    draw.text((x_link, y_link), link_text, font=font_link, fill="#0000EE")

    # 8. QR Code with Logo (Transparent & Branded)
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H, # High error correction essential for logos
        box_size=10,
        border=4,
    )
    qr.add_data(data['verify_link'])
    qr.make(fit=True)

    # Convert QR code to image (Black color and white background)
    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGBA')
    
    # Process pixels to make background transparent (previous logic)
    pixels = qr_img.load()
    for y in range(qr_img.height):
        for x in range(qr_img.width):
            if pixels[x, y][:3] == (255, 255, 255):
                pixels[x, y] = (255, 255, 255, 0)

    # --- Section for placing logo in the middle ---
    try:
        logo = Image.open(os.path.join(data_dir, "logo.png")).convert("RGBA") # Your logo file
        
        # Calculate logo size (approx 25% of QR code size)
        qr_width, qr_height = qr_img.size
        logo_size = int(qr_width * 0.25) 
        logo = logo.resize((logo_size, logo_size))
        
        # Find position to place logo exactly in the middle
        logo_pos = ((qr_width - logo_size) // 2, (qr_height - logo_size) // 2)
        
        # Paste logo on top of QR code
        qr_img.paste(logo, logo_pos, mask=logo)
    except FileNotFoundError:
        print("Logo not found! Generating QR without logo.")

    # Resize final QR code according to certificate size
    final_qr_size = int(img_height * 0.12)
    qr_img = qr_img.resize((final_qr_size, final_qr_size))

    # Place exactly in the middle (centered) of the certificate
    # X position will be middle, Y position below body text
    qr_x = int(img_width * 0.20)
    qr_y = int(img_height * 0.28) # Right above signature and below text
    
    img.paste(qr_img, (qr_x, qr_y), mask=qr_img)

    # 9. Signatures Attach
    try:
        # Signature size increased slightly to fit with the larger design
        sig_width = int(img_width * 0.18) # Increased from 15% to 18%
        sig_height = int(img_height * 0.10) # Increased from 8% to 10%
        
        # Head Signature (Above the line on the left)
        head_sig_file = head_sig_path if head_sig_path else os.path.join(data_dir, "head_signature.png")
        head_sig = Image.open(head_sig_file).convert("RGBA")
        head_sig = head_sig.resize((sig_width, sig_height))
        # Signature Y position is fine as dotted line is at the same place
        img.paste(head_sig, (int(img_width * 0.15), int(img_height * 0.72)), mask=head_sig)

        # Mentor Signature (Above the line on the right)
        mentor_sig_file = mentor_sig_path if mentor_sig_path else os.path.join(data_dir, "mentor_signature.png")
        mentor_sig = Image.open(mentor_sig_file).convert("RGBA")
        mentor_sig = mentor_sig.resize((sig_width, sig_height))
        img.paste(mentor_sig, (int(img_width * 0.65), int(img_height * 0.72)), mask=mentor_sig)
    except FileNotFoundError:
        print("Signature images not found. Skipping signatures.")

    # 10. Final Image Save
    output_filename = os.path.join(output_dir, f"{data['cert_id']}.jpg")
    # Quality set to 100 while saving so text looks perfect
    img.convert('RGB').save(output_filename, quality=100)
    print(f"Certificate saved successfully as {output_filename}")
    return output_filename