export const architectureModules = [
  {
    id: 'nav-encoder', title: 'Navi Encoder',
    node: { x: 248, y: 310, width: 143, height: 26 },
    figures: [
      {
        path: 'research/nav-encoder.png', width: 2600, height: 789,
        alt: 'Waypoint, road-link and speed-limit branches feed a shared attention layer and navigation projector.',
        caption: 'Three branches encode waypoints, road links with maneuver and lane attributes, and speed limits. Self-attention combines their outputs, and a projector produces nine navigation tokens per frame.',
      },
      {
        path: 'research/navi-pretrain.png', width: 2600, height: 1122,
        alt: 'Navigation pretraining with teacher-generated instructions, a frozen language model and an auxiliary reconstruction decoder.',
        caption: 'During pretraining, a frozen language model reads the navigation tokens and predicts route instructions written by an offline teacher. An auxiliary decoder reconstructs road links, lanes and speed limits. EponaX then freezes the encoder and projector.',
      },
    ],
  },
  {
    id: 'dino-tok', title: 'DINO-Tok',
    node: { x: 506, y: 345, width: 319, height: 26 },
    figures: [{
      path: 'research/dino-tok.png', width: 2600, height: 1256,
      alt: 'DINO-Tok combines deep semantic features and projected texture features for image reconstruction. The lower panels detail the autoencoder and vector quantization stages.',
      caption: 'DINO-Tok combines deep DINO features that capture scene semantics with shallow features that preserve texture for image reconstruction. EponaX uses this frozen encoder for the front view and passes both feature groups from the five surround cameras to the Multi-View Encoder.',
    }],
  },
  {
    id: 'mvtok', title: 'Multi-View Encoder',
    node: { x: 651, y: 308, width: 174, height: 26 },
    figures: [{
      path: 'research/mvtok-details.png', width: 2600, height: 726,
      alt: 'Two geometry-aware branches compress features from five surround cameras. During training, the semantic decoder also guides the reconstruction of fine detail.',
      caption: 'Across five surround cameras, separate branches compress semantic features and fine visual detail into 640 tokens. Both use camera geometry and cross-view attention. During pretraining, a decoder reconstructs the original DINO-Tok features, using the semantic reconstruction to guide the recovery of fine detail.',
    }],
  },
  {
    id: 'walt', title: 'WALT',
    node: { x: 887, y: 2, width: 340, height: 503.5 },
    figures: [{
      path: 'research/walt.png', width: 2600, height: 1059,
      alt: 'WALT aligns semantic trajectory tokens with a frozen world model, combines them with geometry tokens and decodes the resulting latents into a trajectory.',
      caption: 'WALT encodes a six-second, 60-waypoint trajectory as ten latent tokens. During pretraining, its semantic branch learns to match the world model’s visual representation, while a geometry branch helps reconstruct the path. In EponaX, TrajLoop refines the latent tokens and the frozen WALT decoder converts them back into waypoints.',
    }],
  },
];
