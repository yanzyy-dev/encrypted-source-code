import base64

def encode_source(source: str) -> str:
    return base64.b64encode(source.encode("utf-8")).decode("ascii")

def decode_source(payload: str) -> str:
    return base64.b64decode(payload).decode("utf-8")

if __name__ == "__main__":
    with open("input.js", "r", encoding="utf-8") as source:
        encoded = encode_source(source.read())
    with open("encoded.txt", "w", encoding="utf-8") as output:
        output.write(encoded)
