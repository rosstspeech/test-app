import Head from 'next/head';
import { GetServerSideProps } from 'next';
import useSpeechmaticsRt from '../utilities/speechmaticsRt';

type AppProps = {
  jwt?: string;
};

export default function Home({ jwt }: AppProps) {
  const transcriptionConfig = {
    language: 'en',
    operating_point: 'enhanced',
    enable_partials: true,
    max_delay: 2
  };

  const {
    isConnected,
    sessionEnd,
    sessionStart,
    partialTranscript,
    transcript
  } = useSpeechmaticsRt({ jwt: jwt, config: transcriptionConfig });

  const toggle_mic = () => {
    if (!isConnected) {
      sessionStart();
    } else {
      sessionEnd();
    }
  };

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.1/css/all.css" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css"
          integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm"
          crossOrigin="anonymous"
        />
        <script
          src="https://code.jquery.com/jquery-3.6.3.min.js"
          integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU="
          crossOrigin="anonymous"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js"
          integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl"
          crossOrigin="anonymous"
        ></script>
      </Head>

      <div className="container-fluid" style={{maxWidth: '50%'}}>
        <div className="display col-sm-12">
          <h2>Partials Transcript</h2>
          <div>{partialTranscript}</div>
          <h2>Final Transcript</h2>
          <div>{transcript}</div>
        </div>
        <button className="col-sm-6 btn btn-success" onClick={toggle_mic} id="mic_button">
          <i className={`fas ${isConnected ? 'fa-microphone-slash' : 'fa-microphone'}`}> Microphone</i>
        </button>
        <button style={{ borderRadius: '10px' }} id="status" className={`col-12 ${isConnected ? 'btn-success' : 'btn-danger'}`} disabled>
          <b id="status_text">{isConnected ? 'Connected' : 'Not Connected'}</b>
        </button>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  console.log('Fetching');
  try {
    const response = await fetch(`${process.env.MP_ENDPOINT_URL}/v1/api_keys?type=rt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_API_KEY}`
      },
      body: JSON.stringify({ ttl: 3600 })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch JWT');
    }

    const data = await response.json();
    const jwt = data.key_value;

    if (!jwt) {
      throw new Error('JWT undefined');
    }

    return {
      props: { jwt }
    };
  } catch (error) {
    console.error('Error fetching JWT:', error);
    return {
      props: { jwt: null }
    };
  }
};
