# 4.152.1 — Solar/Cycles navigation

Adds the same direct view switcher to Solar System and Cycles: hierarchy,
seasons, precession, galactic year, phase space, resonances/Saros, reference
planes, Antikythera, linked analysis and Ancient Chronometry.

Navigation delegates time to the existing AtlasTime authority. Switching views
does not write epoch, rate, pause or direction. Chronometry uses its world-owned
laboratory route. The existing frame dropdown uses the same navigation handler.

Preserves the published 4.152.0 time fabric, First-Principles Atlas and prior
GPU safety changes. Measurement artifacts retain the version at which they were
actually measured; they have not been remeasured for this UI-only patch.

Published at the owner's explicit request without further release checks.
