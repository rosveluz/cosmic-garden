import serial
import mysql.connector
import numpy as np
from scipy.signal import butter, lfilter
from datetime import datetime

# Establish serial connection
ser = serial.Serial('/dev/ttyACM0', 9600, timeout=1)

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
    xf = np.fft.rfftfreq(N, 1/fs)
    idx_peak = np.argmax(np.abs(yf))
    return xf[idx_peak], 2.0/N * np.abs(yf[idx_peak])

# Read data from serial
def read_serial_data():
    try:
        raw_data = ser.readline()
        return int(raw_data.strip())
    except ValueError:
        return None

def main():
    fs = 1000  # Sampling rate
    lowcut = 20.0
    highcut = 300.0  # Frequency limits
    num_samples = 500
    samples = []

    try:
        conn = mysql.connector.connect(host='localhost', user='root', password='pollitech', database='PolliTech-Beta')
        cursor = conn.cursor()
        print("Database connection established")
    except mysql.connector.Error as err:
        print("Database connection failed:", err)
        return

    while True:
        data = read_serial_data()
        if data is not None:
            samples.append(data)
            if len(samples) >= num_samples:
                filtered_samples = butter_bandpass_filter(samples, lowcut, highcut, fs)
                frequency, amplitude = calculate_frequency(filtered_samples, fs)
                current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')  # Correctly format the datetime

                sql = "INSERT INTO `Cosmic-Garden` (Time, Frequency, Amplitude) VALUES (%s, %s, %s)"
                cursor.execute(sql, (current_time, float(frequency), float(amplitude)))  # Ensure frequency and amplitude are floats
                conn.commit()
                print("Data inserted:", current_time, frequency, amplitude)
                samples = []

    cursor.close()
    conn.close()
    ser.close()

if __name__ == "__main__":
    main()
