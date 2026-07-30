"""Place a layer by maximising WORTH -- err(absent) - err(present) over the same box.

solve_band.py minimises the error of the finished stack, which slides a layer to the
least-bad spot when it does not belong in the window at all. This asks the question
that actually matters: is this layer better here than not at all?

Worth has its own blind spot: in a cascade where several layers paint the same kind
of ink, a wrong position can still cover a lot of the right ink and score well. Always
confirm a worth result against `locate.py`, which matches the asset alone -- see
SLICING.md, "The worth probe can be wrong too".

    python3 scripts/worth.py <band.json> <nodeId> <x0> <x1> <y0> <y1> [step]
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from solve_band import load, paste, compose, make_mask, band_error, FRAME_W

def probe(jobpath, nid, xr, yr):
    job=json.load(open(jobpath)); y0,y1=job['y0'],job['y1']; H=y1-y0; L=job['layers']
    imgs={s['id']:load(s['asset'], s.get('scale',2)) for s in L}
    ref=Image.open('.figma-tmp/frame242-full.png').convert('RGB').crop((0,y0,FRAME_W,y1))
    mask=make_mask(job.get('textMasks',[]),y0,H)
    i=[k for k,s in enumerate(L) if s['id']==nid][0]; im=imgs[nid]
    below=compose(L,imgs,y0,H,hi=i); above=compose(L,imgs,y0,H,lo=i+1)
    out=[]
    for yy in yr:
        for x in xr:
            b=(max(0,x-4),max(0,yy-y0-4),min(FRAME_W,x+im.width+4),min(H,yy-y0+im.height+4))
            c=below.copy(); paste(c,im,x,yy-y0); c.alpha_composite(above)
            pres=band_error(ref,c,mask,b)
            c2=below.copy(); c2.alpha_composite(above)
            out.append((band_error(ref,c2,mask,b)-pres,x,yy))
    out.sort(reverse=True)
    w,bx,by=out[0]
    edge = bx in (min(xr),max(xr)) or by in (min(yr),max(yr))
    print(f'{nid}  export {im.width}x{im.height}  best ({bx},{by}) worth {w:+.3f}'
          + ('   AT WINDOW EDGE' if edge else ''))
    print('   ', '  '.join(f'({x},{y})={v:+.2f}' for v,x,y in out[:6]))
    return bx,by

if __name__ == '__main__':
    a=sys.argv
    st=int(a[7]) if len(a)>7 else 1
    probe(a[1], a[2], range(int(a[3]),int(a[4])+1,st), range(int(a[5]),int(a[6])+1,st))
