export const architectureModules = [
  {
    id: 'nav-encoder', title: 'Navi Encoder',
    node: { x: 248, y: 310, width: 143, height: 26 },
    figures: [
      {
        path: 'research/nav-encoder.png', width: 2600, height: 789,
        heading: 'Encoder architecture',
        alt: 'Waypoint, road-link and speed-limit branches feed a shared attention layer and navigation projector.',
        caption: 'Three branches encode waypoints, road links with maneuver and lane attributes, and speed limits. Self-attention combines their outputs, and a projector produces nine navigation tokens per frame.',
      },
      {
        path: 'research/navi-pretrain.png', width: 2600, height: 1146,
        heading: 'Pretraining pipeline',
        alt: 'Navigation pretraining with teacher-generated instructions, a frozen language model and an auxiliary reconstruction decoder.',
        caption: 'An offline teacher rewrites each route record as a driving instruction. We train the encoder and projector so a frozen language model can generate that instruction from the navigation tokens. An auxiliary decoder recovers road geometry, lane guidance and speed limits. After pretraining, EponaX keeps the encoder and projector frozen.',
      },
    ],
  },
  {
    id: 'dino-tok', title: 'DINO-Tok',
    node: { x: 506, y: 345, width: 319, height: 26 },
    figures: [{
      path: 'research/dino-tok.png', width: 2600, height: 1256,
      paperUrl: 'https://arxiv.org/pdf/2511.20565v2',
      alt: 'DINO-Tok combines deep semantic features and projected texture features for image reconstruction. The lower panels detail the autoencoder and vector quantization stages.',
      caption: 'DINO-Tok combines deep DINO features that capture scene semantics with shallow features that preserve texture for image reconstruction. EponaX uses the frozen encoder for all six cameras and sends the five surround views to the Multi-View Encoder for further compression.',
    }],
  },
  {
    id: 'mvtok', title: 'Multi-View Encoder',
    node: { x: 651, y: 308, width: 174, height: 26 },
    figures: [{
      path: 'research/mvtok-details.png?v=d0f75ef426', width: 2600, height: 746,
      alt: 'Two geometry-aware branches compress features from five surround cameras. During training, the semantic decoder also guides the reconstruction of fine detail.',
      caption: <>
        <p>
          The Multi-View Encoder achieves <strong>16× spatial compression</strong>, reducing 10,240 DINO-Tok feature positions from the five surround cameras to 640 tokens.
          Two branches use camera geometry to combine information across views. One captures scene semantics and the other preserves fine visual detail. Each output token contains features from both branches.
        </p>
        <p>
          During MVTok pretraining, the decoder reconstructs the original DINO-Tok features from these tokens.
          EponaX uses only the frozen MVTok encoder and computes its future surround-view prediction loss directly on the 640 compressed tokens.
        </p>
      </>,
    }],
  },
  {
    id: 'walt', title: 'WALT',
    node: { x: 887, y: 2, width: 340, height: 503.5 },
    figures: [{
      path: 'research/walt.png?v=3ddd07c2d1', width: 2600, height: 1059,
      paperUrl: 'https://arxiv.org/pdf/2609.30436',
      alt: 'WALT first combines semantic and geometry features to reconstruct a trajectory. In Stage 2, only the trajectory planner is trainable. It takes world state tokens as input and sends predicted latents to a frozen trajectory decoder.',
      caption: [
        'EponaX uses WALT to represent a six-second trajectory with ten latent tokens. During WALT pretraining, the semantic branch learns to align its features with the state tokens of a frozen driving world model, while the geometry branch preserves the shape of the path. The decoder combines features from both branches to reconstruct the recorded trajectory.',
        'In EponaX, TrajLoop is the trajectory planner shown in Stage 2. It uses features from the EponaX backbone to refine ten trajectory tokens over five steps. The frozen WALT decoder then turns those tokens into 60 waypoints.',
      ],
    }],
  },
];
