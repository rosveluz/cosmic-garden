import serial
import numpy as np
from scipy.signal import butter, lfilter
from datetime import datetime
import mysql.connector

# Establish serial connection
ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)

# Establish database connection
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="pollitech",
    database="PolliTech-Beta"
)
cursor = db.cursor()

# Bandpass filter design
def butter_bandpass(lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def butter_bandpass_filter(data, lowcut, highcut, fs, order=5):
    b, a = butter_bandpass(lowcut, highcut, fs, order)
    return lfilter(b, a, data)

# Calculate frequency using FFT
def calculate_frequency(data, fs):
    N = len(data)
    yf = np.fft.rfft(data)
    xf = np.fft.rfftfreq(N, 1 / fs)
    idx_peak = np.argmax(np.abs(yf))
    return float(xf[idx_peak]), float(2.0 / N * np.abs(yf[idx_peak]))

# Read data from serial
def read_serial_data():
    try:
        raw_data = ser.readline()
        data_int = int(raw_data.strip())
        print(f"Read data: {data_int}")  # Print read serial data
        return data_int
    except ValueError:
        print("Failed to read data")
        return None

def main():
    fs = 1000  # Sampling rate
    lowcut = 20.0
    highcut = 300.0  # Frequency limits
    num_samples = 500
    samples = []

    while True:
        data = read_serial_data()
        if data is not None:
            samples.append(data)
            if len(samples) >= num_samples:
                filtered_samples = butter_bandpass_filter(samples, lowcut, highcut, fs)
                frequency, amplitude = calculate_frequency(filtered_samples, fs)

                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                sql = "INSERT INTO `Cosmic-Garden` (Time, Frequency, Amplitude) VALUES (%s, %s, %s)"
                cursor.execute(sql, (current_time, frequency, amplitude))
                db.commit()

                # Print the entire row data that is being inserted into the database
                print(f"Data inserted into database: Time={current_time}, Frequency={frequency:.2f}, Amplitude={amplitude:.2f}")

                samples = []  # Reset the samples after sending

if __name__ == "__main__":
    main()

