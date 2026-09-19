from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import os
import tempfile

app = Flask(__name__)

print("Loading Whisper model...")

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="float16"
)

print("Whisper model loaded successfully.")


@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "success": True,
        "message": "Whisper service is running"
    })


@app.route("/transcribe", methods=["POST"])
def transcribe():
    try:
        if "audio" not in request.files:
            return jsonify({
                "success": False,
                "message": "Audio file is required"
            }), 400

        audio = request.files["audio"]

        if not audio.filename:
            return jsonify({
                "success": False,
                "message": "Invalid audio file"
            }), 400

        suffix = (
            os.path.splitext(audio.filename)[1]
            or ".webm"
        )

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            audio.save(temp_file.name)
            temp_path = temp_file.name

        try:
            segments, info = model.transcribe(
                temp_path,
                beam_size=5,
                vad_filter=True,
                condition_on_previous_text=False,
                temperature=0.0,
                language=None,
                task="transcribe"
            )

            segments = list(segments)

            transcript = " ".join(
                segment.text.strip()
                for segment in segments
            ).strip()

            print(f"Detected language: {info.language}")
            print(
                f"Language probability: "
                f"{info.language_probability:.3f}"
            )
            print(f"Transcript: {transcript}")

            return jsonify({
                "success": True,
                "data": {
                    "transcript": transcript,
                    "language": info.language,
                    "languageProbability":
                        info.language_probability
                }
            })

        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as error:
        print("Transcription error:", error)

        return jsonify({
            "success": False,
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )