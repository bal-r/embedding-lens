# Third-party materials

The root MIT license applies to original project source code and documentation. It does not
grant rights in third-party model weights, source videos, extracted video frames or vocabulary
material. Generated phrase lists may also include terms derived from those vocabularies.

## Models

Weights are downloaded separately and are not committed. Follow the terms and usage instructions
of the exact model revision you use:

- [Qwen3-VL-Embedding 2B](https://huggingface.co/Qwen/Qwen3-VL-Embedding-2B)
- [Qwen3-VL-Reranker 2B](https://huggingface.co/Qwen/Qwen3-VL-Reranker-2B)
- [EmbeddingGemma 2](https://huggingface.co/google/embeddinggemma-2)
- [SigLIP 2 base](https://huggingface.co/google/siglip2-base-patch16-256)

## Video and screenshots

The source videos come from [@rbalazs](https://www.youtube.com/@rbalazs). Full video files are not
committed. The public demo includes derived thumbnail strips and interface screenshots; these
are not covered by the code license. Game and simulator imagery can include rights held by the
respective creators. Source links and moment timestamps are available in the demo.

Two moments have been removed from public media and readouts. Their original research IDs remain
reserved. See [`lens/publication.py`](lens/publication.py) for the publication filter.

## Vocabularies

The vocabulary builder draws from the following sources. Their terms remain applicable to
redistribution of the original or derived material:

- [RAM++ / Recognize Anything](https://github.com/xinyu1205/recognize-anything)
- ImageNet-21k labels through [timm](https://github.com/huggingface/pytorch-image-models)
- [Places365](https://github.com/CSAILVision/places365)
- [Kinetics](https://github.com/deepmind/kinetics-i3d)
- [WordNet](https://wordnet.princeton.edu/)

See [`lens/vocab.py`](lens/vocab.py) for how the candidate lists are assembled. This is an
attribution and scope note; it is not a replacement license for the listed materials.
